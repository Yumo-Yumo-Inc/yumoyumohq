-- Neon PostgreSQL Database Schema
-- Run this SQL in Neon Console or via setup-database.ts script

-- User profiles table (for display names, gender, birth dates)
CREATE TABLE IF NOT EXISTS user_profiles (
  username VARCHAR(255) PRIMARY KEY,
  display_name VARCHAR(255),
  gender VARCHAR(50),
  birth_date DATE,
  honor INTEGER DEFAULT 50,
  occupation VARCHAR(255),
  city VARCHAR(255),
  country VARCHAR(255),
  website VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- ============================================
-- MERCHANT TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_tiers (
  id SERIAL PRIMARY KEY,
  merchant_name_pattern VARCHAR(255) NOT NULL,
  merchant_name_regex VARCHAR(500), -- Optional regex for complex matching
  country VARCHAR(2), -- NULL = applies to all countries
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('discount', 'normal', 'premium')),
  confidence DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  source VARCHAR(100) DEFAULT 'MANUAL', -- 'MANUAL', 'AI', 'USER_REPORTED', 'GOOGLE_PLACES'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(merchant_name_pattern, country)
);

CREATE INDEX IF NOT EXISTS idx_merchant_tiers_lookup 
  ON merchant_tiers(merchant_name_pattern, country) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_merchant_tiers_country 
  ON merchant_tiers(country) 
  WHERE is_active = TRUE;

-- ============================================
-- CITY TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS city_tiers (
  id SERIAL PRIMARY KEY,
  country VARCHAR(2) NOT NULL,
  city_name VARCHAR(255) NOT NULL,
  city_name_variants TEXT[], -- ["istanbul", "istanbul cbd", "beyoğlu"]
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('low', 'mid', 'high')),
  source VARCHAR(100) DEFAULT 'MANUAL', -- 'MANUAL', 'GOOGLE_PLACES', 'NUMBEO'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country, city_name)
);

CREATE INDEX IF NOT EXISTS idx_city_tiers_lookup 
  ON city_tiers(country, city_name) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_city_tiers_variants 
  ON city_tiers USING GIN(city_name_variants) 
  WHERE is_active = TRUE;

-- ============================================
-- ECONOMIC INDICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS economic_indices (
  id SERIAL PRIMARY KEY,
  country VARCHAR(2) NOT NULL,
  index_type VARCHAR(20) NOT NULL CHECK (index_type IN ('CPI', 'FUEL', 'LABOR', 'RENT', 'DIGITAL')),
  year_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  value DECIMAL(10, 4) NOT NULL,
  source VARCHAR(100), -- 'TURKSTAT', 'BLS', 'WORLD_BANK', 'FRED', etc.
  source_url TEXT, -- URL where data was fetched from
  fetch_date TIMESTAMP, -- When this data was fetched
  is_verified BOOLEAN DEFAULT FALSE, -- Manually verified data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country, index_type, year_month)
);

CREATE INDEX IF NOT EXISTS idx_economic_indices_lookup 
  ON economic_indices(country, index_type, year_month DESC);

CREATE INDEX IF NOT EXISTS idx_economic_indices_latest 
  ON economic_indices(country, index_type, year_month DESC) 
  WHERE is_verified = TRUE;

-- ============================================
-- ETL JOB LOGS (for tracking updates)
-- ============================================
CREATE TABLE IF NOT EXISTS etl_job_logs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL, -- 'fetch_cpi_us', 'fetch_cpi_tr', etc.
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_etl_job_logs_recent 
  ON etl_job_logs(started_at DESC) 
  WHERE status IN ('success', 'failed');

-- ============================================
-- MERCHANT PLACES CACHE (for Google Places API results)
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_places_cache (
  id SERIAL PRIMARY KEY,
  merchant_name_normalized VARCHAR(255) NOT NULL,
  merchant_name_original VARCHAR(255), -- Original name for reference
  place_id VARCHAR(255),
  price_level INTEGER CHECK (price_level >= 0 AND price_level <= 4),
  country VARCHAR(2),
  place_name VARCHAR(255),
  place_types TEXT[], -- Array of Google Places types
  domain VARCHAR(255),
  confidence DECIMAL(3, 2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- Cache expiration (default: 30 days)
  UNIQUE(merchant_name_normalized, country)
);

CREATE INDEX IF NOT EXISTS idx_merchant_places_cache_lookup 
  ON merchant_places_cache(merchant_name_normalized, country) 
  WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_merchant_places_cache_expires 
  ON merchant_places_cache(expires_at) 
  WHERE expires_at IS NOT NULL;

-- ============================================
-- SCHEDULED DELETIONS TABLE (for auto-deleting receipt images)
-- ============================================
-- Receipt images are scheduled for deletion 48 hours after upload
-- A cron job periodically processes this table and deletes expired blobs
CREATE TABLE IF NOT EXISTS scheduled_deletions (
  id SERIAL PRIMARY KEY,
  receipt_id VARCHAR(255) NOT NULL UNIQUE, -- UUID of the receipt
  blob_url TEXT NOT NULL, -- Full Vercel Blob URL
  delete_at TIMESTAMP NOT NULL, -- When to delete (upload_time + 48h)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'deleted', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0, -- Retry count
  last_error TEXT, -- Last error message if failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP -- When the deletion was processed
);

CREATE INDEX IF NOT EXISTS idx_scheduled_deletions_pending 
  ON scheduled_deletions(delete_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_deletions_receipt 
  ON scheduled_deletions(receipt_id);

-- ============================================
-- RECEIPT SYNC DELETIONS (for offline cache tombstones)
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_sync_deletions (
  receipt_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receipt_sync_deletions_username_deleted_at
  ON receipt_sync_deletions(username, deleted_at DESC);
