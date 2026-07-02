-- ID (Indonesia) canonical merchants + patterns. Run in Neon SQL Editor after migration 009.
-- Idempotent: safe to run multiple times.


INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Indomaret', 'Indomaret', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Indomaret')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Indomaret', 'indomaret', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indomaret' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'indomaret')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'INDOMARET', 'indomaret', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indomaret' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'indomaret')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Indoaret', 'indoaret', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indomaret' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'indoaret')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Alfamart', 'Alfamart', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Alfamart')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Alfamart', 'alfamart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamart' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfamart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ALFAMART', 'alfamart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamart' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfamart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Alfa Mart', 'alfa mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamart' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfa mart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Alfamidi', 'Alfamidi', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Alfamidi')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Alfamidi', 'alfamidi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamidi' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfamidi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ALFAMIDI', 'alfamidi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamidi' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfamidi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Alfa Midi', 'alfa midi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamidi' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfa midi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Circle K Indonesia', 'Circle K', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Circle K Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Circle K', 'circle k', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Circle K Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'circle k')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CircleK', 'circlek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Circle K Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'circlek')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CIRCLE K', 'circle k', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Circle K Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'circle k')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lawson Indonesia', 'Lawson', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lawson Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lawson', 'lawson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lawson Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lawson')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LAWSON', 'lawson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lawson Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lawson')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'FamilyMart Indonesia', 'FamilyMart', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('FamilyMart Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FamilyMart', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Family Mart', 'family mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'family mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FAMILYMART', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT '7-Eleven Indonesia', '7-Eleven', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('7-Eleven Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7-Eleven', '7 eleven', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7 eleven')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7-Eleven Indonesia', '7 eleven indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7 eleven indonesia')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7ELEVEN', '7eleven', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7eleven')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Super Indo', 'Super Indo', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Super Indo')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Super Indo', 'super indo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Super Indo' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'super indo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SuperIndo', 'superindo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Super Indo' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'superindo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SUPER INDO', 'super indo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Super Indo' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'super indo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hypermart Indonesia', 'Hypermart', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hypermart Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hypermart', 'hypermart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hypermart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hypermart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HYPERMART', 'hypermart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hypermart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hypermart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Carrefour Indonesia', 'Carrefour', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Carrefour Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Carrefour', 'carrefour', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Carrefour Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefour')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CARREFOUR', 'carrefour', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Carrefour Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefour')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Transmart Indonesia', 'Transmart', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Transmart Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Transmart', 'transmart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Transmart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'transmart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TRANSMART', 'transmart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Transmart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'transmart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lotte Mart Indonesia', 'Lotte Mart', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lotte Mart Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotte Mart', 'lotte mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotte Mart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotte mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LotteMart', 'lottemart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotte Mart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lottemart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LOTTE MART', 'lotte mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotte Mart Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotte mart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'AEON Indonesia', 'AEON', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('AEON Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AEON', 'aeon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AEON Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Aeon Indonesia', 'aeon indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AEON Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon indonesia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Ranch Market Indonesia', 'Ranch Market', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Ranch Market Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ranch Market', 'ranch market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ranch Market Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ranch market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ranch Market', 'ranch market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ranch Market Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ranch market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hero Supermarket', 'Hero', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hero Supermarket')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hero', 'hero', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hero Supermarket' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hero')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hero Supermarket', 'hero supermarket', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hero Supermarket' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hero supermarket')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Guardian Indonesia', 'Guardian', 'pharmacy', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Guardian Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Guardian', 'guardian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Guardian Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guardian')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GUARDIAN', 'guardian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Guardian Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guardian')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Watsons Indonesia', 'Watsons', 'pharmacy', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Watsons Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watsons', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'WATSONS', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KFC Indonesia', 'KFC', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KFC Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KFC', 'kfc', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kfc')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kentucky Fried Chicken', 'kentucky fried chicken', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kentucky fried chicken')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'McDonald''s Indonesia', 'McDonald''s', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('McDonald''s Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald''s', 'mcdonald s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonalds', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MCDONALDS', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Indonesia', 'Starbucks', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'STARBUCKS', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shell Indonesia', 'Shell', 'fuel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shell Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shell', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHELL', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pertamina Indonesia', 'Pertamina', 'fuel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pertamina Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pertamina', 'pertamina', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pertamina Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pertamina')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PERTAMINA', 'pertamina', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pertamina Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pertamina')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pertamina Gas Station', 'pertamina gas station', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pertamina Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pertamina gas station')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'BP Indonesia', 'BP', 'fuel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('BP Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BP', 'bp', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BP Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bp')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BP Indonesia', 'bp indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BP Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bp indonesia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tokopedia', 'Tokopedia', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tokopedia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tokopedia', 'tokopedia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tokopedia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tokopedia')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TOKOPEDIA', 'tokopedia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tokopedia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tokopedia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shopee Indonesia', 'Shopee', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shopee Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shopee', 'shopee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHOPEE', 'shopee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lazada Indonesia', 'Lazada', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lazada Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lazada', 'lazada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LAZADA', 'lazada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bukalapak', 'Bukalapak', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bukalapak')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bukalapak', 'bukalapak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bukalapak' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bukalapak')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BUKALAPAK', 'bukalapak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bukalapak' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bukalapak')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Blibli Indonesia', 'Blibli', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Blibli Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Blibli', 'blibli', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Blibli Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'blibli')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BLIBLI', 'blibli', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Blibli Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'blibli')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gojek Indonesia', 'Gojek', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gojek Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gojek', 'gojek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gojek Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gojek')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GOJEK', 'gojek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gojek Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gojek')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GoFood', 'gofood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gojek Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gofood')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Grab Indonesia', 'Grab', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Grab Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Grab', 'grab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GRAB', 'grab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GrabFood', 'grabfood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grabfood')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Kopi Kenangan', 'Kopi Kenangan', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Kopi Kenangan')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kopi Kenangan', 'kopi kenangan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kopi Kenangan' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kopi kenangan')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kopi Kenangan', 'kopi kenangan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kopi Kenangan' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kopi kenangan')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Janji Jiwa', 'Janji Jiwa', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Janji Jiwa')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Janji Jiwa', 'janji jiwa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Janji Jiwa' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'janji jiwa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Janji Jiwa', 'janji jiwa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Janji Jiwa' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'janji jiwa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Fore Coffee', 'Fore Coffee', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Fore Coffee')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Fore Coffee', 'fore coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fore Coffee' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fore coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Fore Coffee', 'fore coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fore Coffee' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fore coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Reserve Indonesia', 'Starbucks Reserve', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Reserve Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks Reserve', 'starbucks reserve', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Reserve Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks reserve')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'J.CO Donuts Indonesia', 'J.CO Donuts', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('J.CO Donuts Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'J.CO Donuts', 'j co donuts', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'J.CO Donuts Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'j co donuts')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'JCO', 'jco', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'J.CO Donuts Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jco')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'J Co Donuts', 'j co donuts', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'J.CO Donuts Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'j co donuts')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Krispy Kreme Indonesia', 'Krispy Kreme', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Krispy Kreme Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Krispy Kreme', 'krispy kreme', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Krispy Kreme Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'krispy kreme')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Krispy Kreme', 'krispy kreme', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Krispy Kreme Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'krispy kreme')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pizza Hut Indonesia', 'Pizza Hut', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pizza Hut Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Hut', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PIZZA HUT', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Domino''s Pizza Indonesia', 'Domino''s', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Domino''s Pizza Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Domino''s', 'domino s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'domino s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dominos', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DOMINOS', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'HokBen Indonesia', 'HokBen', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('HokBen Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HokBen', 'hokben', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HokBen Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hokben')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HokBen', 'hokben', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HokBen Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hokben')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HOKBEN', 'hokben', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HokBen Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hokben')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Yoshinoya Indonesia', 'Yoshinoya', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Yoshinoya Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yoshinoya', 'yoshinoya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yoshinoya Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yoshinoya')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'YOSHINOYA', 'yoshinoya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yoshinoya Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yoshinoya')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sukiya Indonesia', 'Sukiya', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sukiya Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sukiya', 'sukiya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sukiya Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sukiya')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SUKIYA', 'sukiya', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sukiya Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sukiya')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Marugame Udon Indonesia', 'Marugame Udon', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Marugame Udon Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Marugame Udon', 'marugame udon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Marugame Udon Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'marugame udon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Marugame', 'marugame', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Marugame Udon Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'marugame')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Es Teler 77', 'Es Teler 77', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Es Teler 77')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Es Teler 77', 'es teler 77', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Es Teler 77' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'es teler 77')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Es Teler 77', 'es teler 77', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Es Teler 77' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'es teler 77')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bakmi GM', 'Bakmi GM', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bakmi GM')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bakmi GM', 'bakmi gm', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bakmi GM' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bakmi gm')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bakmi GM', 'bakmi gm', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bakmi GM' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bakmi gm')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Solaria Indonesia', 'Solaria', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Solaria Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Solaria', 'solaria', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Solaria Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'solaria')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SOLARIA', 'solaria', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Solaria Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'solaria')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Geprek Bensu', 'Geprek Bensu', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Geprek Bensu')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Geprek Bensu', 'geprek bensu', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Geprek Bensu' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'geprek bensu')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Geprek Bensu', 'geprek bensu', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Geprek Bensu' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'geprek bensu')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Rumah Makan Padang', 'Rumah Makan Padang', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Rumah Makan Padang')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rumah Makan Padang', 'rumah makan padang', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rumah Makan Padang' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rumah makan padang')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'RM Padang', 'rm padang', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rumah Makan Padang' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rm padang')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Warteg', 'Warteg', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Warteg')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Warteg', 'warteg', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Warteg' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'warteg')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'WARTEG', 'warteg', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Warteg' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'warteg')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Ayam Geprek', 'Ayam Geprek', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Ayam Geprek')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ayam Geprek', 'ayam geprek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ayam Geprek' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ayam geprek')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ayam Geprek', 'ayam geprek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ayam Geprek' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ayam geprek')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Chatime Indonesia', 'Chatime', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Chatime Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chatime', 'chatime', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chatime Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chatime')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cha Time', 'cha time', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chatime Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cha time')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CHATIME', 'chatime', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chatime Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chatime')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Kopi Luwak Indonesia', 'Kopi Luwak', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Kopi Luwak Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kopi Luwak', 'kopi luwak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kopi Luwak Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kopi luwak')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kopi Luwak', 'kopi luwak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kopi Luwak Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kopi luwak')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Excelso Indonesia', 'Excelso', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Excelso Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Excelso', 'excelso', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Excelso Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'excelso')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'EXCELSO', 'excelso', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Excelso Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'excelso')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Otten Coffee', 'Otten Coffee', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Otten Coffee')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Otten Coffee', 'otten coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Otten Coffee' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'otten coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Otten Coffee', 'otten coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Otten Coffee' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'otten coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gramedia Indonesia', 'Gramedia', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gramedia Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gramedia', 'gramedia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gramedia Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gramedia')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GRAMEDIA', 'gramedia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gramedia Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gramedia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Electronic City Indonesia', 'Electronic City', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Electronic City Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Electronic City', 'electronic city', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Electronic City Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'electronic city')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Electronic City', 'electronic city', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Electronic City Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'electronic city')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tokopedia Official Store', 'Tokopedia Store', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tokopedia Official Store')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tokopedia Store', 'tokopedia store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tokopedia Official Store' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tokopedia store')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Blibli Mall', 'Blibli Mall', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Blibli Mall')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Blibli Mall', 'blibli mall', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Blibli Mall' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'blibli mall')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Dan+Dan Indonesia', 'Dan+Dan', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Dan+Dan Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dan+Dan', 'dan dan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dan+Dan Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dan dan')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dan Dan', 'dan dan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dan+Dan Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dan dan')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Indomaret Point', 'Indomaret Point', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Indomaret Point')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Indomaret Point', 'indomaret point', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indomaret Point' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'indomaret point')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Alfamart Super', 'Alfamart Super', 'convenience', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Alfamart Super')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Alfamart Super', 'alfamart super', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Alfamart Super' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'alfamart super')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lotte Mart Super', 'Lotte Mart Super', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lotte Mart Super')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotte Mart Super', 'lotte mart super', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotte Mart Super' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotte mart super')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Food Hall Indonesia', 'Food Hall', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Food Hall Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Food Hall', 'food hall', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Food Hall Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'food hall')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Food Hall', 'food hall', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Food Hall Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'food hall')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Farmers Market Indonesia', 'Farmers Market', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Farmers Market Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Farmers Market', 'farmers market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Farmers Market Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'farmers market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Giant Indonesia', 'Giant', 'supermarket', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Giant Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Giant', 'giant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Giant Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'giant')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GIANT Indonesia', 'giant indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Giant Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'giant indonesia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Uniqlo Indonesia', 'Uniqlo', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Uniqlo Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Uniqlo', 'uniqlo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Uniqlo Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'uniqlo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'UNIQLO', 'uniqlo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Uniqlo Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'uniqlo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'H&M Indonesia', 'H&M', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('H&M Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'H&M', 'h m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'h m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'H and M', 'h and m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'h and m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HM', 'hm', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hm')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Zara Indonesia', 'Zara', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Zara Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zara', 'zara', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zara Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zara')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ZARA', 'zara', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zara Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zara')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sephora Indonesia', 'Sephora', 'beauty', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sephora Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sephora', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SEPHORA', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Samsung Indonesia', 'Samsung', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Samsung Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Samsung', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SAMSUNG', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'OPPO Indonesia', 'OPPO', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('OPPO Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OPPO', 'oppo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OPPO Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oppo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Oppo', 'oppo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OPPO Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oppo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vivo Indonesia', 'Vivo', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vivo Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vivo', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VIVO', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Xiaomi Indonesia', 'Xiaomi', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Xiaomi Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Xiaomi', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XIAOMI', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Telkomsel Indonesia', 'Telkomsel', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Telkomsel Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Telkomsel', 'telkomsel', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Telkomsel Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'telkomsel')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TELKOMSEL', 'telkomsel', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Telkomsel Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'telkomsel')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Indosat Ooredoo', 'Indosat', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Indosat Ooredoo')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Indosat', 'indosat', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indosat Ooredoo' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'indosat')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'INDOSAT', 'indosat', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indosat Ooredoo' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'indosat')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IM3', 'im3', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Indosat Ooredoo' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'im3')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'XL Axiata', 'XL Axiata', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('XL Axiata')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XL Axiata', 'xl axiata', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'XL Axiata' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xl axiata')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XL', 'xl', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'XL Axiata' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xl')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XL Axiata', 'xl axiata', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'XL Axiata' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xl axiata')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Three Indonesia', '3 Indonesia', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Three Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '3 Indonesia', '3 indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Three Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '3 indonesia')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tri', 'tri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Three Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tri')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '3', '3', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Three Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '3')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pertamina Lubricants', 'Pertamina Lubricants', 'fuel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pertamina Lubricants')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pertamina Lubricants', 'pertamina lubricants', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pertamina Lubricants' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pertamina lubricants')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Total Indonesia', 'Total', 'fuel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Total Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Total', 'total', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Total Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'total')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TOTAL Indonesia', 'total indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Total Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'total indonesia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Chevron Indonesia', 'Chevron', 'fuel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Chevron Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chevron', 'chevron', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chevron Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chevron')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CHEVRON', 'chevron', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chevron Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chevron')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vivo Plaza Indonesia', 'Vivo Plaza', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vivo Plaza Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vivo Plaza', 'vivo plaza', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Plaza Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo plaza')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'iBox Indonesia', 'iBox', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('iBox Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'iBox', 'ibox', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'iBox Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ibox')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'iBox Indonesia', 'ibox indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'iBox Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ibox indonesia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Erafone Indonesia', 'Erafone', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Erafone Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Erafone', 'erafone', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Erafone Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'erafone')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ERAFONE', 'erafone', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Erafone Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'erafone')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Matahari Department Store', 'Matahari', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Matahari Department Store')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Matahari', 'matahari', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Matahari Department Store' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'matahari')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MATAHARI', 'matahari', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Matahari Department Store' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'matahari')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Central Department Store Indonesia', 'Central', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Central Department Store Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Central', 'central', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Central Department Store Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'central')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Central Department', 'central department', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Central Department Store Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'central department')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sogo Indonesia', 'Sogo', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sogo Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sogo', 'sogo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sogo Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sogo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SOGO', 'sogo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sogo Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sogo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Metro Department Store', 'Metro', 'apparel', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Metro Department Store')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Metro', 'metro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Metro Department Store' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'metro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Metro Department', 'metro department', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Metro Department Store' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'metro department')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Ace Hardware Indonesia', 'Ace Hardware', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Ace Hardware Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ace Hardware', 'ace hardware', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ace Hardware Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ace hardware')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ace Hardware', 'ace hardware', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ace Hardware Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ace hardware')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Informa Indonesia', 'Informa', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Informa Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Informa', 'informa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Informa Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'informa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'INFORMA', 'informa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Informa Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'informa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'IKEA Indonesia', 'IKEA', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('IKEA Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IKEA', 'ikea', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IKEA Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ikea')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ikea Indonesia', 'ikea indonesia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IKEA Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ikea indonesia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Informa Elektronik', 'Informa Elektronik', 'electronics', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Informa Elektronik')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Informa Elektronik', 'informa elektronik', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Informa Elektronik' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'informa elektronik')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'BreadTalk Indonesia', 'BreadTalk', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('BreadTalk Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BreadTalk', 'breadtalk', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BreadTalk Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'breadtalk')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bread Talk', 'bread talk', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BreadTalk Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bread talk')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BREADTALK', 'breadtalk', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BreadTalk Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'breadtalk')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Paris Baguette Indonesia', 'Paris Baguette', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Paris Baguette Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Paris Baguette', 'paris baguette', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Paris Baguette Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'paris baguette')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Paris Baguette', 'paris baguette', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Paris Baguette Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'paris baguette')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Coffee Indonesia', 'Starbucks Coffee', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Coffee Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks Coffee', 'starbucks coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Coffee Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'J.CO Donuts & Coffee', 'J.CO', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('J.CO Donuts & Coffee')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'J.CO', 'j co', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'J.CO Donuts & Coffee' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'j co')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'JCO Donuts', 'jco donuts', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'J.CO Donuts & Coffee' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jco donuts')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Kopi Oey', 'Kopi Oey', 'cafe', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Kopi Oey')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kopi Oey', 'kopi oey', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kopi Oey' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kopi oey')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kopi Oey', 'kopi oey', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kopi Oey' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kopi oey')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Warung Padang', 'Warung Padang', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Warung Padang')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Warung Padang', 'warung padang', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Warung Padang' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'warung padang')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bebek Bengil Indonesia', 'Bebek Bengil', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bebek Bengil Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bebek Bengil', 'bebek bengil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bebek Bengil Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bebek bengil')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bebek Bengil', 'bebek bengil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bebek Bengil Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bebek bengil')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Naughty Nuri''s Indonesia', 'Naughty Nuri''s', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Naughty Nuri''s Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Naughty Nuri''s', 'naughty nuri s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Naughty Nuri''s Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'naughty nuri s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Naughty Nuri', 'naughty nuri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Naughty Nuri''s Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'naughty nuri')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sederhana Bintaro', 'Sederhana', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sederhana Bintaro')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sederhana', 'sederhana', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sederhana Bintaro' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sederhana')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sederhana Restaurant', 'sederhana restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sederhana Bintaro' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sederhana restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bakso Boedjangan', 'Bakso Boedjangan', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bakso Boedjangan')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bakso Boedjangan', 'bakso boedjangan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bakso Boedjangan' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bakso boedjangan')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Martabak Orins', 'Martabak Orins', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Martabak Orins')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Martabak Orins', 'martabak orins', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Martabak Orins' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'martabak orins')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Martabak Orins', 'martabak orins', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Martabak Orins' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'martabak orins')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Papa Ron''s Pizza', 'Papa Ron''s', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Papa Ron''s Pizza')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Papa Ron''s', 'papa ron s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa Ron''s Pizza' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa ron s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Papa Rons', 'papa rons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa Ron''s Pizza' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa rons')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Seribu Rasa', 'Seribu Rasa', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Seribu Rasa')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Seribu Rasa', 'seribu rasa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Seribu Rasa' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'seribu rasa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Seribu Rasa', 'seribu rasa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Seribu Rasa' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'seribu rasa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'D''Cost Indonesia', 'D''Cost', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('D''Cost Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'D''Cost', 'd cost', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'D''Cost Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'd cost')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DCost', 'dcost', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'D''Cost Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dcost')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'D Cost', 'd cost', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'D''Cost Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'd cost')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'HokBen Delivery', 'HokBen Delivery', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('HokBen Delivery')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HokBen Delivery', 'hokben delivery', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'HokBen Delivery' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hokben delivery')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Yoshinoya Delivery', 'Yoshinoya Delivery', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Yoshinoya Delivery')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yoshinoya Delivery', 'yoshinoya delivery', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yoshinoya Delivery' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yoshinoya delivery')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KFC Delivery Indonesia', 'KFC Delivery', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KFC Delivery Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KFC Delivery', 'kfc delivery', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Delivery Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kfc delivery')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'McDonald''s Delivery', 'McDonald''s Delivery', 'restaurant', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('McDonald''s Delivery')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald''s Delivery', 'mcdonald s delivery', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Delivery' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald s delivery')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'GoFood Merchant', 'GoFood', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('GoFood Merchant')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GoFood', 'gofood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GoFood Merchant' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gofood')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Go Food', 'go food', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GoFood Merchant' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'go food')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'GrabFood Merchant', 'GrabFood', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('GrabFood Merchant')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GrabFood', 'grabfood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GrabFood Merchant' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grabfood')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Grab Food', 'grab food', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GrabFood Merchant' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab food')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'ShopeeFood Indonesia', 'ShopeeFood', 'marketplace', 'candidate', 'ID'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('ShopeeFood Indonesia')) AND country_code = 'ID');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ShopeeFood', 'shopeefood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'ShopeeFood Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopeefood')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shopee Food', 'shopee food', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'ShopeeFood Indonesia' AND m.country_code = 'ID'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee food')
LIMIT 1;
