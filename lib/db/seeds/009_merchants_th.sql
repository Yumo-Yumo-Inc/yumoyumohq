-- TH (Thailand) canonical merchants + patterns. Run in Neon SQL Editor after migration 009.
-- Idempotent: safe to run multiple times.


INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT '7-Eleven Thailand', '7-Eleven', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('7-Eleven Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7-Eleven', '7 eleven', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7 eleven')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7-Eleven Thailand', '7 eleven thailand', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7 eleven thailand')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7ELEVEN', '7eleven', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7eleven')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lotus''s Thailand', 'Lotus''s', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lotus''s Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotus''s', 'lotus s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotus', 'lotus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LOTUS', 'lotus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tesco Lotus', 'tesco lotus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tesco lotus')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Big C Thailand', 'Big C', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Big C Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Big C', 'big c', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Big C Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'big c')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BigC', 'bigc', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Big C Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bigc')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIG C', 'big c', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Big C Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'big c')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'CP All Thailand', 'CP All', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('CP All Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CP All', 'cp all', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CP All Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cp all')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CP All', 'cp all', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CP All Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cp all')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Makro Thailand', 'Makro', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Makro Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Makro', 'makro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Makro Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'makro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MAKRO', 'makro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Makro Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'makro')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tops Thailand', 'Tops', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tops Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tops', 'tops', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tops Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tops')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TOPS', 'tops', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tops Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tops')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tops Daily', 'tops daily', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tops Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tops daily')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'FamilyMart Thailand', 'FamilyMart', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('FamilyMart Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FamilyMart', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Family Mart', 'family mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'family mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FAMILYMART', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lawson 108 Thailand', 'Lawson 108', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lawson 108 Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lawson 108', 'lawson 108', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lawson 108 Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lawson 108')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lawson108', 'lawson108', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lawson 108 Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lawson108')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mini Big C', 'Mini Big C', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mini Big C')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mini Big C', 'mini big c', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mini Big C' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mini big c')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mini Big C', 'mini big c', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mini Big C' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mini big c')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Thailand', 'Starbucks', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'STARBUCKS', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'McDonald''s Thailand', 'McDonald''s', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('McDonald''s Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald''s', 'mcdonald s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonalds', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MCDONALDS', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KFC Thailand', 'KFC', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KFC Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KFC', 'kfc', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kfc')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kentucky Fried Chicken', 'kentucky fried chicken', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kentucky fried chicken')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shell Thailand', 'Shell', 'fuel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shell Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shell', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHELL', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'PTT Thailand', 'PTT', 'fuel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('PTT Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PTT', 'ptt', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PTT Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ptt')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PTT Station', 'ptt station', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PTT Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ptt station')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PTT Oil', 'ptt oil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PTT Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ptt oil')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bangchak Thailand', 'Bangchak', 'fuel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bangchak Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bangchak', 'bangchak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bangchak Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bangchak')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BANGCHAK', 'bangchak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bangchak Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bangchak')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Caltex Thailand', 'Caltex', 'fuel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Caltex Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Caltex', 'caltex', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caltex Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caltex')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CALTEX', 'caltex', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caltex Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caltex')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lazada Thailand', 'Lazada', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lazada Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lazada', 'lazada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LAZADA', 'lazada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shopee Thailand', 'Shopee', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shopee Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shopee', 'shopee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHOPEE', 'shopee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Grab Thailand', 'Grab', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Grab Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Grab', 'grab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GRAB', 'grab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GrabFood', 'grabfood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grabfood')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Foodpanda Thailand', 'Foodpanda', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Foodpanda Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Foodpanda', 'foodpanda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodpanda Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'foodpanda')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Food Panda', 'food panda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodpanda Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'food panda')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FOODPANDA', 'foodpanda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodpanda Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'foodpanda')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Line Man Thailand', 'Line Man', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Line Man Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Line Man', 'line man', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Line Man Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'line man')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LineMan', 'lineman', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Line Man Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lineman')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LINE MAN', 'line man', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Line Man Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'line man')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'True Coffee Thailand', 'True Coffee', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('True Coffee Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'True Coffee', 'true coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'True Coffee Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'true coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'True Coffee', 'true coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'True Coffee Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'true coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Amazon Cafe Thailand', 'Amazon Cafe', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Amazon Cafe Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Amazon Cafe', 'amazon cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Amazon Cafe Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'amazon cafe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Amazon Cafe', 'amazon cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Amazon Cafe Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'amazon cafe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Cafe Amazon', 'Cafe Amazon', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Cafe Amazon')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cafe Amazon', 'cafe amazon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cafe Amazon' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cafe amazon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cafe Amazon', 'cafe amazon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cafe Amazon' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cafe amazon')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Black Canyon Thailand', 'Black Canyon', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Black Canyon Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Black Canyon', 'black canyon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Black Canyon Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'black canyon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Black Canyon', 'black canyon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Black Canyon Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'black canyon')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pizza Hut Thailand', 'Pizza Hut', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pizza Hut Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Hut', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PIZZA HUT', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Domino''s Pizza Thailand', 'Domino''s', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Domino''s Pizza Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Domino''s', 'domino s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'domino s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dominos', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DOMINOS', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Subway Thailand', 'Subway', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Subway Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Subway', 'subway', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Subway Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'subway')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SUBWAY', 'subway', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Subway Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'subway')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Swensen''s Thailand', 'Swensen''s', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Swensen''s Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Swensen''s', 'swensen s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Swensen''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'swensen s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Swensens', 'swensens', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Swensen''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'swensens')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SWENSENS', 'swensens', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Swensen''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'swensens')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MK Restaurant Thailand', 'MK Restaurant', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MK Restaurant Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MK Restaurant', 'mk restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MK Restaurant Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mk restaurant')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MK', 'mk', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MK Restaurant Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mk')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MK Restaurants', 'mk restaurants', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MK Restaurant Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mk restaurants')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Yayoi Thailand', 'Yayoi', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Yayoi Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yayoi', 'yayoi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yayoi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yayoi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'YAYOI', 'yayoi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yayoi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yayoi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Fuji Restaurant Thailand', 'Fuji', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Fuji Restaurant Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Fuji', 'fuji', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fuji Restaurant Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fuji')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Fuji Restaurant', 'fuji restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fuji Restaurant Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fuji restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Ootoya Thailand', 'Ootoya', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Ootoya Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ootoya', 'ootoya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ootoya Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ootoya')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OOTOVA', 'ootova', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ootoya Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ootova')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Yoshinoya Thailand', 'Yoshinoya', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Yoshinoya Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yoshinoya', 'yoshinoya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yoshinoya Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yoshinoya')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'YOSHINOYA', 'yoshinoya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yoshinoya Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yoshinoya')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sukiya Thailand', 'Sukiya', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sukiya Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sukiya', 'sukiya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sukiya Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sukiya')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SUKIYA', 'sukiya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sukiya Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sukiya')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Din Tai Fung Thailand', 'Din Tai Fung', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Din Tai Fung Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Din Tai Fung', 'din tai fung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Din Tai Fung Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'din tai fung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Din Tai Fung', 'din tai fung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Din Tai Fung Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'din tai fung')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Foodland Thailand', 'Foodland', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Foodland Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Foodland', 'foodland', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodland Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'foodland')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FOODLAND', 'foodland', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodland Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'foodland')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Villa Market Thailand', 'Villa Market', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Villa Market Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Villa Market', 'villa market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Villa Market Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'villa market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Villa Market', 'villa market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Villa Market Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'villa market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gourmet Market Thailand', 'Gourmet Market', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gourmet Market Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gourmet Market', 'gourmet market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gourmet Market Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gourmet market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gourmet Market', 'gourmet market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gourmet Market Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gourmet market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MaxValu Thailand', 'MaxValu', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MaxValu Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MaxValu', 'maxvalu', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MaxValu Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'maxvalu')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Max Valu', 'max valu', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MaxValu Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'max valu')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MAXVALU', 'maxvalu', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MaxValu Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'maxvalu')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Jiffy Thailand', 'Jiffy', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Jiffy Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Jiffy', 'jiffy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Jiffy Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jiffy')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'JIFFY', 'jiffy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Jiffy Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jiffy')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'CJ Express Thailand', 'CJ Express', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('CJ Express Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CJ Express', 'cj express', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CJ Express Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cj express')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CJ Express', 'cj express', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CJ Express Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cj express')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Watsons Thailand', 'Watsons', 'pharmacy', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Watsons Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watsons', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'WATSONS', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Boots Thailand', 'Boots', 'pharmacy', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Boots Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Boots', 'boots', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boots Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boots')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BOOTS', 'boots', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boots Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boots')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Guardian Thailand', 'Guardian', 'pharmacy', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Guardian Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Guardian', 'guardian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Guardian Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guardian')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GUARDIAN', 'guardian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Guardian Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guardian')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Uniqlo Thailand', 'Uniqlo', 'apparel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Uniqlo Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Uniqlo', 'uniqlo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Uniqlo Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'uniqlo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'UNIQLO', 'uniqlo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Uniqlo Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'uniqlo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'H&M Thailand', 'H&M', 'apparel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('H&M Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'H&M', 'h m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'h m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'H and M', 'h and m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'h and m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HM', 'hm', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hm')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Zara Thailand', 'Zara', 'apparel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Zara Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zara', 'zara', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zara Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zara')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ZARA', 'zara', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zara Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zara')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Central Thailand', 'Central', 'apparel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Central Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Central', 'central', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Central Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'central')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Central Department Store', 'central department store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Central Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'central department store')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Robinson Thailand', 'Robinson', 'apparel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Robinson Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Robinson', 'robinson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Robinson Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'robinson')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ROBINSON', 'robinson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Robinson Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'robinson')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'The Mall Thailand', 'The Mall', 'apparel', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('The Mall Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'The Mall', 'the mall', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'The Mall Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'the mall')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'The Mall Group', 'the mall group', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'The Mall Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'the mall group')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sephora Thailand', 'Sephora', 'beauty', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sephora Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sephora', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SEPHORA', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Power Buy Thailand', 'Power Buy', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Power Buy Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Power Buy', 'power buy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Power Buy Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'power buy')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Power Buy', 'power buy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Power Buy Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'power buy')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Banana IT Thailand', 'Banana IT', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Banana IT Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Banana IT', 'banana it', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Banana IT Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'banana it')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Banana IT', 'banana it', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Banana IT Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'banana it')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Studio 7 Thailand', 'Studio 7', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Studio 7 Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Studio 7', 'studio 7', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Studio 7 Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'studio 7')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Studio 7', 'studio 7', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Studio 7 Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'studio 7')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Samsung Thailand', 'Samsung', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Samsung Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Samsung', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SAMSUNG', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Apple Store Thailand', 'Apple', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Apple Store Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Apple', 'apple', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Apple Store', 'apple store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple store')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'APPLE', 'apple', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'OPPO Thailand', 'OPPO', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('OPPO Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OPPO', 'oppo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OPPO Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oppo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Oppo', 'oppo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OPPO Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oppo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vivo Thailand', 'Vivo', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vivo Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vivo', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VIVO', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Xiaomi Thailand', 'Xiaomi', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Xiaomi Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Xiaomi', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XIAOMI', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Huawei Thailand', 'Huawei', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Huawei Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Huawei', 'huawei', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Huawei Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'huawei')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HUAWEI', 'huawei', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Huawei Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'huawei')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'AIS Thailand', 'AIS', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('AIS Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AIS', 'ais', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AIS Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ais')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Advanced Info Service', 'advanced info service', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AIS Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'advanced info service')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'TrueMove Thailand', 'TrueMove', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('TrueMove Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TrueMove', 'truemove', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TrueMove Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'truemove')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'True Move', 'true move', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TrueMove Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'true move')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TrueMove H', 'truemove h', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TrueMove Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'truemove h')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'dtac Thailand', 'dtac', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('dtac Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'dtac', 'dtac', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'dtac Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dtac')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DTAC', 'dtac', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'dtac Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dtac')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'IKEA Thailand', 'IKEA', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('IKEA Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IKEA', 'ikea', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IKEA Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ikea')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ikea Thailand', 'ikea thailand', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IKEA Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ikea thailand')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'HomePro Thailand', 'HomePro', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('HomePro Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HomePro', 'homepro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HomePro Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'homepro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Home Pro', 'home pro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HomePro Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'home pro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HOMEPRO', 'homepro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HomePro Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'homepro')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Do Home Thailand', 'Do Home', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Do Home Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Do Home', 'do home', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Do Home Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'do home')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Do Home', 'do home', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Do Home Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'do home')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'B2S Thailand', 'B2S', 'electronics', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('B2S Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'B2S', 'b2s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'B2S Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'b2s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'B2S Thailand', 'b2s thailand', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'B2S Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'b2s thailand')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Watsons Thailand', 'Watsons', 'pharmacy', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Watsons Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watsons', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'WATSONS', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'After You Thailand', 'After You', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('After You Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'After You', 'after you', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'After You Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'after you')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'After You', 'after you', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'After You Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'after you')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Audrey Cafe Thailand', 'Audrey Cafe', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Audrey Cafe Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Audrey Cafe', 'audrey cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Audrey Cafe Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'audrey cafe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Audrey Cafe', 'audrey cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Audrey Cafe Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'audrey cafe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Greyhound Cafe Thailand', 'Greyhound Cafe', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Greyhound Cafe Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Greyhound Cafe', 'greyhound cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Greyhound Cafe Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'greyhound cafe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Greyhound Cafe', 'greyhound cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Greyhound Cafe Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'greyhound cafe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Cafe Kaldi Thailand', 'Cafe Kaldi', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Cafe Kaldi Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cafe Kaldi', 'cafe kaldi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cafe Kaldi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cafe kaldi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cafe Kaldi', 'cafe kaldi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cafe Kaldi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cafe kaldi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Inthanin Thailand', 'Inthanin', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Inthanin Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Inthanin', 'inthanin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Inthanin Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'inthanin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Inthanin Coffee', 'inthanin coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Inthanin Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'inthanin coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Doi Chaang Thailand', 'Doi Chaang', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Doi Chaang Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Doi Chaang', 'doi chaang', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Doi Chaang Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'doi chaang')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Doi Chaang Coffee', 'doi chaang coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Doi Chaang Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'doi chaang coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pang Cha Thailand', 'Pang Cha', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pang Cha Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pang Cha', 'pang cha', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pang Cha Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pang cha')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pang Cha', 'pang cha', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pang Cha Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pang cha')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Cha Tra Mue Thailand', 'Cha Tra Mue', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Cha Tra Mue Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cha Tra Mue', 'cha tra mue', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cha Tra Mue Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cha tra mue')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cha Tra Mue', 'cha tra mue', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cha Tra Mue Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cha tra mue')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KFC Thailand Delivery', 'KFC Delivery', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KFC Thailand Delivery')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KFC Delivery', 'kfc delivery', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Thailand Delivery' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kfc delivery')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'McDonald''s Thailand Delivery', 'McDonald''s Delivery', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('McDonald''s Thailand Delivery')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald''s Delivery', 'mcdonald s delivery', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Thailand Delivery' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald s delivery')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pizza Company Thailand', 'Pizza Company', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pizza Company Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Company', 'pizza company', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Company Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza company')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Company', 'pizza company', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Company Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza company')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Chester''s Thailand', 'Chester''s', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Chester''s Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chester''s', 'chester s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chester''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chester s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chester''s Grill', 'chester s grill', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chester''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chester s grill')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Oishi Thailand', 'Oishi', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Oishi Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Oishi', 'oishi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Oishi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oishi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OISHI', 'oishi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Oishi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oishi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shabushi Thailand', 'Shabushi', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shabushi Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shabushi', 'shabushi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shabushi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shabushi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shabushi', 'shabushi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shabushi Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shabushi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Zen Japan Thailand', 'Zen', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Zen Japan Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zen', 'zen', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zen Japan Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zen')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zen Japan', 'zen japan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zen Japan Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zen japan')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'S&P Thailand', 'S&P', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('S&P Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'S&P', 's p', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'S&P Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 's p')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'S and P', 's and p', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'S&P Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 's and p')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'S&P Restaurant', 's p restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'S&P Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 's p restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bonchon Thailand', 'Bonchon', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bonchon Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bonchon', 'bonchon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bonchon Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bonchon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BONCHON', 'bonchon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bonchon Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bonchon')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Papa John''s Thailand', 'Papa John''s', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Papa John''s Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Papa John''s', 'papa john s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa John''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa john s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Papa Johns', 'papa johns', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa John''s Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa johns')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'The Pizza Company', 'The Pizza Company', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('The Pizza Company')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'The Pizza Company', 'the pizza company', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'The Pizza Company' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'the pizza company')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mango Tree Thailand', 'Mango Tree', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mango Tree Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mango Tree', 'mango tree', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mango Tree Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mango tree')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mango Tree', 'mango tree', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mango Tree Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mango tree')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Coca Thailand', 'Coca', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Coca Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Coca', 'coca', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Coca Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'coca')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Coca Suki', 'coca suki', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Coca Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'coca suki')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MK Gold Thailand', 'MK Gold', 'restaurant', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MK Gold Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MK Gold', 'mk gold', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MK Gold Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mk gold')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MK Gold', 'mk gold', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MK Gold Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mk gold')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lotus''s Go Fresh', 'Lotus''s Go Fresh', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lotus''s Go Fresh')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotus''s Go Fresh', 'lotus s go fresh', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Go Fresh' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus s go fresh')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Go Fresh', 'go fresh', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Go Fresh' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'go fresh')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Big C Supercenter', 'Big C Supercenter', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Big C Supercenter')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Big C Supercenter', 'big c supercenter', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Big C Supercenter' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'big c supercenter')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tops Market Thailand', 'Tops Market', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tops Market Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tops Market', 'tops market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tops Market Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tops market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Villa Supermarket', 'Villa Supermarket', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Villa Supermarket')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Villa Supermarket', 'villa supermarket', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Villa Supermarket' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'villa supermarket')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Rimping Thailand', 'Rimping', 'supermarket', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Rimping Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rimping', 'rimping', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rimping Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rimping')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rimping Supermarket', 'rimping supermarket', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rimping Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rimping supermarket')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tops Daily Thailand', 'Tops Daily', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tops Daily Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tops Daily', 'tops daily', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tops Daily Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tops daily')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tops Daily', 'tops daily', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tops Daily Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tops daily')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'CP Fresh Mart', 'CP Fresh Mart', 'convenience', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('CP Fresh Mart')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CP Fresh Mart', 'cp fresh mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CP Fresh Mart' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cp fresh mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CP Fresh Mart', 'cp fresh mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CP Fresh Mart' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cp fresh mart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'PTT Station Cafe', 'PTT Station Cafe', 'cafe', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('PTT Station Cafe')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PTT Station Cafe', 'ptt station cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PTT Station Cafe' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ptt station cafe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lazada Express Thailand', 'Lazada Express', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lazada Express Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lazada Express', 'lazada express', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Express Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada express')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shopee Express Thailand', 'Shopee Express', 'marketplace', 'candidate', 'TH'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shopee Express Thailand')) AND country_code = 'TH');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shopee Express', 'shopee express', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Express Thailand' AND m.country_code = 'TH'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee express')
LIMIT 1;
