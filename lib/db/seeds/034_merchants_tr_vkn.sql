-- TR Merchant VKN (Vergi Kimlik Numarası) seed.
-- Run AFTER migration 034 and 009_merchants_tr.sql.
-- Idempotent: safe to run multiple times.
-- Sources: Türkiye Ticaret Sicili / public company registry.

-- BİM Birleşik Mağazalar A.Ş. - confirmed from live receipt
UPDATE merchants SET vkn = '1750051846'
WHERE canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND country_code = 'TR' AND vkn IS NULL;

-- Migros Ticaret A.Ş.
UPDATE merchants SET vkn = '4600006396'
WHERE canonical_name = 'Migros Ticaret A.Ş.' AND country_code = 'TR' AND vkn IS NULL;

-- A101 Yeni Mağazacılık A.Ş.
UPDATE merchants SET vkn = '2040142060'
WHERE canonical_name = 'A101 Yeni Mağazacılık A.Ş.' AND country_code = 'TR' AND vkn IS NULL;

-- Şok Marketler Ticaret A.Ş.
UPDATE merchants SET vkn = '7850046540'
WHERE canonical_name = 'Şok Marketler Ticaret A.Ş.' AND country_code = 'TR' AND vkn IS NULL;

-- CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.
UPDATE merchants SET vkn = '7820051449'
WHERE canonical_name = 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.' AND country_code = 'TR' AND vkn IS NULL;
