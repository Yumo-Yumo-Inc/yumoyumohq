-- Product catalog schema (from RAW OCR receipt extraction)
-- Run after main schema or via setup script

-- ============================================
-- PRODUCT CATALOG (unique products with price stats)
-- ============================================
CREATE TABLE IF NOT EXISTS product_catalog (
  id SERIAL PRIMARY KEY,
  product_key VARCHAR(512) NOT NULL UNIQUE,
  product_name VARCHAR(500) NOT NULL,
  normalized_name VARCHAR(500) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(255),
  unit VARCHAR(20) NOT NULL DEFAULT 'piece',
  -- Price statistics (TL)
  price_min DECIMAL(12, 2),
  price_p25 DECIMAL(12, 2),
  price_median DECIMAL(12, 2),
  price_p75 DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  price_mean DECIMAL(12, 2),
  absolute_max DECIMAL(12, 2),
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_key ON product_catalog(product_key);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_brand ON product_catalog(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_catalog_normalized ON product_catalog(normalized_name);

-- ============================================
-- PRODUCT MERCHANTS (which merchants sell this product)
-- ============================================
CREATE TABLE IF NOT EXISTS product_catalog_merchants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
  merchant_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, merchant_name)
);

CREATE INDEX IF NOT EXISTS idx_product_merchants_product ON product_catalog_merchants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_merchants_merchant ON product_catalog_merchants(merchant_name);

-- ============================================
-- PRODUCT EXTRACTIONS (raw line items from OCR, for traceability)
-- ============================================
CREATE TABLE IF NOT EXISTS product_extractions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES product_catalog(id) ON DELETE SET NULL,
  ocr_file_name VARCHAR(512) NOT NULL,
  merchant_name VARCHAR(255) NOT NULL,
  raw_text TEXT,
  product_name VARCHAR(500),
  brand VARCHAR(255),
  category VARCHAR(100),
  subcategory VARCHAR(255),
  unit VARCHAR(20),
  unit_price DECIMAL(12, 2),
  quantity DECIMAL(10, 3),
  total_price DECIMAL(12, 2),
  confidence DECIMAL(3, 2),
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_extractions_product ON product_extractions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_extractions_ocr_file ON product_extractions(ocr_file_name);
CREATE INDEX IF NOT EXISTS idx_product_extractions_merchant ON product_extractions(merchant_name);
