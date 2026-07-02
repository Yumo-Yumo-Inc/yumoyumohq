-- MY (Malaysia) canonical merchants + patterns. Run in Neon SQL Editor after migration 009.
-- Idempotent: safe to run multiple times.


INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Giant Hypermarket', 'Giant', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Giant Hypermarket')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Giant', 'giant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Giant Hypermarket' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'giant')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GIANT', 'giant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Giant Hypermarket' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'giant')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Giant Hypermarket', 'giant hypermarket', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Giant Hypermarket' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'giant hypermarket')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'AEON Malaysia', 'AEON', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('AEON Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AEON', 'aeon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AEON Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Aeon', 'aeon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AEON Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AEON Big', 'aeon big', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AEON Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon big')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Jaya Grocer', 'jaya grocer', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'AEON Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jaya grocer')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lotus''s Malaysia', 'Lotus''s', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lotus''s Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotus''s', 'lotus s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotus', 'lotus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LOTUS', 'lotus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotus')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tesco Malaysia', 'tesco malaysia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotus''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tesco malaysia')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mydin Malaysia', 'Mydin', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mydin Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mydin', 'mydin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mydin Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mydin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MYDIN', 'mydin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mydin Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mydin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mydin Wholesale', 'mydin wholesale', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mydin Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mydin wholesale')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT '99 Speedmart', '99 Speedmart', 'convenience', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('99 Speedmart')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '99 Speedmart', '99 speedmart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '99 Speedmart' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '99 speedmart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '99 Speed Mart', '99 speed mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '99 Speedmart' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '99 speed mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '99Speedmart', '99speedmart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '99 Speedmart' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '99speedmart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT '7-Eleven Malaysia', '7-Eleven', 'convenience', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('7-Eleven Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7-Eleven', '7 eleven', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7 eleven')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7-Eleven Malaysia', '7 eleven malaysia', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7 eleven malaysia')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '7ELEVEN', '7eleven', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = '7-Eleven Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '7eleven')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'FamilyMart Malaysia', 'FamilyMart', 'convenience', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('FamilyMart Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FamilyMart', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Family Mart', 'family mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'family mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FAMILYMART', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'FamilyMart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MyNews Malaysia', 'MyNews', 'convenience', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MyNews Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MyNews', 'mynews', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MyNews Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mynews')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'My News', 'my news', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MyNews Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'my news')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MYNEWS', 'mynews', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MyNews Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mynews')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Guardian Malaysia', 'Guardian', 'pharmacy', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Guardian Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Guardian', 'guardian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Guardian Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guardian')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GUARDIAN', 'guardian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Guardian Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guardian')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Watsons Malaysia', 'Watsons', 'pharmacy', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Watsons Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watsons', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'WATSONS', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watson', 'watson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watson')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Malaysia', 'Starbucks', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'STARBUCKS', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'McDonald''s Malaysia', 'McDonald''s', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('McDonald''s Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald''s', 'mcdonald s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonalds', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MCDONALDS', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KFC Malaysia', 'KFC', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KFC Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KFC', 'kfc', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kfc')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kentucky Fried Chicken', 'kentucky fried chicken', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kentucky fried chicken')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shell Malaysia', 'Shell', 'fuel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shell Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shell', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHELL', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Petronas Malaysia', 'Petronas', 'fuel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Petronas Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Petronas', 'petronas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petronas Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'petronas')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PETRONAS', 'petronas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petronas Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'petronas')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Petron', 'petron', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petronas Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'petron')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'BHP Malaysia', 'BHP', 'fuel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('BHP Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BHP', 'bhp', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BHP Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bhp')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BHP Petroleum', 'bhp petroleum', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BHP Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bhp petroleum')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Caltex Malaysia', 'Caltex', 'fuel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Caltex Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Caltex', 'caltex', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caltex Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caltex')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CALTEX', 'caltex', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caltex Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caltex')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Parkson Malaysia', 'Parkson', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Parkson Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Parkson', 'parkson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Parkson Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'parkson')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PARKSON', 'parkson', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Parkson Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'parkson')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Village Park Restaurant', 'Village Park', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Village Park Restaurant')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Village Park', 'village park', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Village Park Restaurant' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'village park')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Village Park Restaurant', 'village park restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Village Park Restaurant' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'village park restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'OldTown White Coffee', 'OldTown', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('OldTown White Coffee')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OldTown', 'oldtown', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OldTown White Coffee' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oldtown')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Old Town', 'old town', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OldTown White Coffee' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'old town')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OLDTOWN', 'oldtown', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OldTown White Coffee' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oldtown')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Secret Recipe Malaysia', 'Secret Recipe', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Secret Recipe Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Secret Recipe', 'secret recipe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Secret Recipe Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'secret recipe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SecretRecipe', 'secretrecipe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Secret Recipe Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'secretrecipe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tealive Malaysia', 'Tealive', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tealive Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tealive', 'tealive', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tealive Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tealive')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tea Live', 'tea live', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tealive Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tea live')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TEALIVE', 'tealive', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tealive Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tealive')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Chatime Malaysia', 'Chatime', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Chatime Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chatime', 'chatime', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chatime Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chatime')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cha Time', 'cha time', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chatime Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cha time')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CHATIME', 'chatime', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chatime Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chatime')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Boost Malaysia', 'Boost', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Boost Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Boost', 'boost', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boost Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boost')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BOOST', 'boost', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boost Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boost')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Domino''s Pizza Malaysia', 'Domino''s', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Domino''s Pizza Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Domino''s', 'domino s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'domino s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dominos', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DOMINOS', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pizza Hut Malaysia', 'Pizza Hut', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pizza Hut Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Hut', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PIZZA HUT', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Subway Malaysia', 'Subway', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Subway Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Subway', 'subway', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Subway Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'subway')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SUBWAY', 'subway', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Subway Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'subway')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Econsave Malaysia', 'Econsave', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Econsave Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Econsave', 'econsave', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Econsave Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'econsave')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Econ Save', 'econ save', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Econsave Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'econ save')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ECONSAVE', 'econsave', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Econsave Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'econsave')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Jaya Grocer', 'Jaya Grocer', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Jaya Grocer')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Jaya Grocer', 'jaya grocer', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Jaya Grocer' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jaya grocer')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Jaya Grocer', 'jaya grocer', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Jaya Grocer' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jaya grocer')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Village Grocer', 'Village Grocer', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Village Grocer')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Village Grocer', 'village grocer', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Village Grocer' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'village grocer')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Village Grocer', 'village grocer', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Village Grocer' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'village grocer')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lazada Malaysia', 'Lazada', 'marketplace', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lazada Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lazada', 'lazada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LAZADA', 'lazada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lazada Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lazada')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shopee Malaysia', 'Shopee', 'marketplace', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shopee Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shopee', 'shopee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHOPEE', 'shopee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shopee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shopee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Grab Malaysia', 'Grab', 'marketplace', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Grab Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Grab', 'grab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GRAB', 'grab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GrabFood', 'grabfood', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Grab Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'grabfood')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Foodpanda Malaysia', 'Foodpanda', 'marketplace', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Foodpanda Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Foodpanda', 'foodpanda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodpanda Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'foodpanda')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Food Panda', 'food panda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodpanda Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'food panda')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FOODPANDA', 'foodpanda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Foodpanda Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'foodpanda')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Senheng Malaysia', 'Senheng', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Senheng Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Senheng', 'senheng', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Senheng Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'senheng')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SENHENG', 'senheng', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Senheng Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'senheng')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'SenQ Malaysia', 'SenQ', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('SenQ Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SenQ', 'senq', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'SenQ Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'senq')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SENQ', 'senq', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'SenQ Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'senq')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Courts Malaysia', 'Courts', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Courts Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Courts', 'courts', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Courts Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'courts')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'COURTS', 'courts', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Courts Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'courts')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Harvey Norman Malaysia', 'Harvey Norman', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Harvey Norman Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Harvey Norman', 'harvey norman', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Harvey Norman Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'harvey norman')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Harvey Norman', 'harvey norman', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Harvey Norman Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'harvey norman')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Uniqlo Malaysia', 'Uniqlo', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Uniqlo Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Uniqlo', 'uniqlo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Uniqlo Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'uniqlo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'UNIQLO', 'uniqlo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Uniqlo Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'uniqlo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'H&M Malaysia', 'H&M', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('H&M Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'H&M', 'h m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'h m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'H and M', 'h and m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'h and m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HM', 'hm', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'H&M Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hm')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Padini Malaysia', 'Padini', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Padini Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Padini', 'padini', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Padini Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'padini')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PADINI', 'padini', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Padini Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'padini')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vincci Malaysia', 'Vincci', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vincci Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vincci', 'vincci', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vincci Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vincci')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VINCCI', 'vincci', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vincci Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vincci')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sephora Malaysia', 'Sephora', 'beauty', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sephora Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sephora', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SEPHORA', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sasa Malaysia', 'Sasa', 'beauty', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sasa Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sasa', 'sasa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sasa Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sasa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SASA', 'sasa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sasa Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sasa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'BreadStory Malaysia', 'BreadStory', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('BreadStory Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BreadStory', 'breadstory', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BreadStory Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'breadstory')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bread Story', 'bread story', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BreadStory Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bread story')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'PappaRich Malaysia', 'PappaRich', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('PappaRich Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PappaRich', 'papparich', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PappaRich Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papparich')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pappa Rich', 'pappa rich', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PappaRich Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pappa rich')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PAPPARICH', 'papparich', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'PappaRich Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papparich')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Restaurant Kin Kin', 'Kin Kin', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Restaurant Kin Kin')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kin Kin', 'kin kin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Kin Kin' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kin kin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kin Kin Restaurant', 'kin kin restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Kin Kin' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kin kin restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Nandos Malaysia', 'Nando''s', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Nandos Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Nando''s', 'nando s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nandos Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nando s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Nandos', 'nandos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nandos Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nandos')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NANDOS', 'nandos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nandos Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nandos')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sushi King Malaysia', 'Sushi King', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sushi King Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sushi King', 'sushi king', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sushi King Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sushi king')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sushi King', 'sushi king', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sushi King Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sushi king')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sakae Sushi Malaysia', 'Sakae Sushi', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sakae Sushi Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sakae Sushi', 'sakae sushi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sakae Sushi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sakae sushi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sakae', 'sakae', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sakae Sushi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sakae')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Din Tai Fung Malaysia', 'Din Tai Fung', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Din Tai Fung Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Din Tai Fung', 'din tai fung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Din Tai Fung Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'din tai fung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Din Tai Fung', 'din tai fung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Din Tai Fung Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'din tai fung')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Coffee Bean Malaysia', 'Coffee Bean', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Coffee Bean Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Coffee Bean', 'coffee bean', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Coffee Bean Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'coffee bean')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'The Coffee Bean', 'the coffee bean', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Coffee Bean Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'the coffee bean')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'COFFEE BEAN', 'coffee bean', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Coffee Bean Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'coffee bean')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'San Francisco Coffee', 'San Francisco Coffee', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('San Francisco Coffee')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'San Francisco Coffee', 'san francisco coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'San Francisco Coffee' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'san francisco coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SF Coffee', 'sf coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'San Francisco Coffee' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sf coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Baskin Robbins Malaysia', 'Baskin Robbins', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Baskin Robbins Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Baskin Robbins', 'baskin robbins', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baskin Robbins Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'baskin robbins')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Baskin Robbins', 'baskin robbins', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baskin Robbins Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'baskin robbins')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Burgertory Malaysia', 'Burgertory', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Burgertory Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Burgertory', 'burgertory', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burgertory Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'burgertory')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Burgertory', 'burgertory', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burgertory Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'burgertory')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MyBurgerLab Malaysia', 'MyBurgerLab', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MyBurgerLab Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MyBurgerLab', 'myburgerlab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MyBurgerLab Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'myburgerlab')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'My Burger Lab', 'my burger lab', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MyBurgerLab Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'my burger lab')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vivo Pizza Malaysia', 'Vivo Pizza', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vivo Pizza Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vivo Pizza', 'vivo pizza', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Pizza Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo pizza')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vivo', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Pizza Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Marrybrown Malaysia', 'Marrybrown', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Marrybrown Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Marrybrown', 'marrybrown', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Marrybrown Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'marrybrown')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Marry Brown', 'marry brown', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Marrybrown Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'marry brown')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MARRYBROWN', 'marrybrown', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Marrybrown Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'marrybrown')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'A&W Malaysia', 'A&W', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('A&W Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'A&W', 'a w', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'A&W Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'a w')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'A and W', 'a and w', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'A&W Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'a and w')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AW', 'aw', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'A&W Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aw')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pizza Man Malaysia', 'Pizza Man', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pizza Man Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Man', 'pizza man', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Man Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza man')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Man', 'pizza man', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Man Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza man')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Boat Noodle Malaysia', 'Boat Noodle', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Boat Noodle Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Boat Noodle', 'boat noodle', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boat Noodle Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boat noodle')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Boat Noodle', 'boat noodle', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boat Noodle Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boat noodle')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Family Mart Malaysia', 'Family Mart', 'convenience', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Family Mart Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Family Mart', 'family mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Family Mart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'family mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FamilyMart', 'familymart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Family Mart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'familymart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KK Super Mart Malaysia', 'KK Super Mart', 'convenience', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KK Super Mart Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KK Super Mart', 'kk super mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KK Super Mart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kk super mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KK Mart', 'kk mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KK Super Mart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kk mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KK SuperMart', 'kk supermart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KK Super Mart Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kk supermart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mamak Restaurant', 'Mamak', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mamak Restaurant')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mamak', 'mamak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mamak Restaurant' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mamak')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MAMAK', 'mamak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mamak Restaurant' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mamak')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'NSK Grocer', 'NSK', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('NSK Grocer')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NSK', 'nsk', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'NSK Grocer' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nsk')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NSK Grocer', 'nsk grocer', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'NSK Grocer' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nsk grocer')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'The Store Malaysia', 'The Store', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('The Store Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'The Store', 'the store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'The Store Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'the store')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'The Store', 'the store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'The Store Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'the store')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mydin Mall', 'Mydin Mall', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mydin Mall')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mydin Mall', 'mydin mall', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mydin Mall' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mydin mall')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mydin Mall', 'mydin mall', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mydin Mall' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mydin mall')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hero Market Malaysia', 'Hero', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hero Market Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hero', 'hero', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hero Market Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hero')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hero Market', 'hero market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hero Market Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hero market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pacific Coffee Malaysia', 'Pacific Coffee', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pacific Coffee Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pacific Coffee', 'pacific coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pacific Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pacific coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pacific Coffee', 'pacific coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pacific Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pacific coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Reserve Malaysia', 'Starbucks Reserve', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Reserve Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks Reserve', 'starbucks reserve', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Reserve Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks reserve')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks Reserve', 'starbucks reserve', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Reserve Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks reserve')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Zus Coffee Malaysia', 'Zus Coffee', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Zus Coffee Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zus Coffee', 'zus coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zus Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zus coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zus', 'zus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zus Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zus')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ZUS COFFEE', 'zus coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zus Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zus coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Billion Malaysia', 'Billion', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Billion Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Billion', 'billion', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Billion Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'billion')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Billion Shopping', 'billion shopping', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Billion Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'billion shopping')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mega Value Store', 'Mega Value', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mega Value Store')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mega Value', 'mega value', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mega Value Store' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mega value')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mega Value Store', 'mega value store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mega Value Store' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mega value store')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'TF Value-Mart', 'TF Value-Mart', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('TF Value-Mart')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TF Value-Mart', 'tf value mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TF Value-Mart' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tf value mart')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TF Value Mart', 'tf value mart', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TF Value-Mart' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tf value mart')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MR.DIY Malaysia', 'MR.DIY', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MR.DIY Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MR.DIY', 'mr diy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mr diy')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MR DIY', 'mr diy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mr diy')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MRDiy', 'mrdiy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mrdiy')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Daiso Malaysia', 'Daiso', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Daiso Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Daiso', 'daiso', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Daiso Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'daiso')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DAISO', 'daiso', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Daiso Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'daiso')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Miniso Malaysia', 'Miniso', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Miniso Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Miniso', 'miniso', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Miniso Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'miniso')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MINISO', 'miniso', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Miniso Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'miniso')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Samsung Malaysia', 'Samsung', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Samsung Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Samsung', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SAMSUNG', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Apple Store Malaysia', 'Apple', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Apple Store Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Apple', 'apple', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Apple Store', 'apple store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple store')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'APPLE', 'apple', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Xiaomi Malaysia', 'Xiaomi', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Xiaomi Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Xiaomi', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XIAOMI', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Huawei Malaysia', 'Huawei', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Huawei Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Huawei', 'huawei', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Huawei Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'huawei')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HUAWEI', 'huawei', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Huawei Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'huawei')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'OPPO Malaysia', 'OPPO', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('OPPO Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OPPO', 'oppo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OPPO Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oppo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Oppo', 'oppo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'OPPO Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'oppo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vivo Malaysia', 'Vivo', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vivo Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vivo', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VIVO', 'vivo', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vivo Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vivo')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Digi Malaysia', 'Digi', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Digi Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Digi', 'digi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Digi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'digi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DIGI', 'digi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Digi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'digi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Digi Telecommunications', 'digi telecommunications', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Digi Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'digi telecommunications')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Maxis Malaysia', 'Maxis', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Maxis Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Maxis', 'maxis', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Maxis Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'maxis')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MAXIS', 'maxis', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Maxis Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'maxis')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Celcom Malaysia', 'Celcom', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Celcom Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Celcom', 'celcom', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Celcom Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'celcom')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CELCOM', 'celcom', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Celcom Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'celcom')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'U Mobile Malaysia', 'U Mobile', 'electronics', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('U Mobile Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'U Mobile', 'u mobile', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'U Mobile Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'u mobile')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'U Mobile', 'u mobile', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'U Mobile Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'u mobile')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'UMobile', 'umobile', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'U Mobile Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'umobile')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Decathlon Malaysia', 'Decathlon', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Decathlon Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Decathlon', 'decathlon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Decathlon Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'decathlon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DECATHLON', 'decathlon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Decathlon Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'decathlon')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Nike Malaysia', 'Nike', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Nike Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Nike', 'nike', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nike Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nike')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NIKE', 'nike', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nike Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nike')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Adidas Malaysia', 'Adidas', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Adidas Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Adidas', 'adidas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Adidas Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'adidas')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ADIDAS', 'adidas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Adidas Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'adidas')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Puma Malaysia', 'Puma', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Puma Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Puma', 'puma', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Puma Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'puma')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PUMA', 'puma', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Puma Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'puma')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Skechers Malaysia', 'Skechers', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Skechers Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Skechers', 'skechers', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Skechers Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'skechers')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SKECHERS', 'skechers', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Skechers Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'skechers')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Padini Holdings', 'Padini Holdings', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Padini Holdings')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Padini Holdings', 'padini holdings', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Padini Holdings' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'padini holdings')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Padini', 'padini', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Padini Holdings' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'padini')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Brands Outlet Malaysia', 'Brands Outlet', 'apparel', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Brands Outlet Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Brands Outlet', 'brands outlet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Brands Outlet Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'brands outlet')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Brands Outlet', 'brands outlet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Brands Outlet Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'brands outlet')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Aeon Co Malaysia', 'Aeon Co', 'supermarket', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Aeon Co Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Aeon Co', 'aeon co', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Aeon Co Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon co')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AEON Co', 'aeon co', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Aeon Co Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aeon co')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Village Park Nasi Lemak', 'Village Park Nasi Lemak', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Village Park Nasi Lemak')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Village Park Nasi Lemak', 'village park nasi lemak', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Village Park Nasi Lemak' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'village park nasi lemak')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Restaurant Sri Nirwana', 'Sri Nirwana', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Restaurant Sri Nirwana')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sri Nirwana', 'sri nirwana', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Sri Nirwana' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sri nirwana')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sri Nirwana Maju', 'sri nirwana maju', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Sri Nirwana' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sri nirwana maju')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Restaurant Rebung', 'Rebung', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Restaurant Rebung')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rebung', 'rebung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Rebung' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rebung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rebung Restaurant', 'rebung restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Rebung' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rebung restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Madam Kwan Malaysia', 'Madam Kwan', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Madam Kwan Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Madam Kwan', 'madam kwan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Madam Kwan Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'madam kwan')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Madam Kwan''s', 'madam kwan s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Madam Kwan Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'madam kwan s')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Restaurant Antara', 'Antara', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Restaurant Antara')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Antara', 'antara', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Antara' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'antara')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Antara Restaurant', 'antara restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Restaurant Antara' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'antara restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bijan Bar and Restaurant', 'Bijan', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bijan Bar and Restaurant')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bijan', 'bijan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bijan Bar and Restaurant' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bijan')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bijan Restaurant', 'bijan restaurant', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bijan Bar and Restaurant' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bijan restaurant')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Frontera Malaysia', 'Frontera', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Frontera Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Frontera', 'frontera', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Frontera Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'frontera')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Frontera Grill', 'frontera grill', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Frontera Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'frontera grill')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tony Roma''s Malaysia', 'Tony Roma''s', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tony Roma''s Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tony Roma''s', 'tony roma s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tony Roma''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tony roma s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tony Romas', 'tony romas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tony Roma''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tony romas')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'TGI Friday''s Malaysia', 'TGI Friday''s', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('TGI Friday''s Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TGI Friday''s', 'tgi friday s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TGI Friday''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tgi friday s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TGIF', 'tgif', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TGI Friday''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tgif')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TGI Fridays', 'tgi fridays', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'TGI Friday''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tgi fridays')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Chili''s Malaysia', 'Chili''s', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Chili''s Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chili''s', 'chili s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chili''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chili s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Chilis', 'chilis', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chili''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chilis')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CHILIS', 'chilis', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Chili''s Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'chilis')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sushi Zanmai Malaysia', 'Sushi Zanmai', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sushi Zanmai Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sushi Zanmai', 'sushi zanmai', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sushi Zanmai Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sushi zanmai')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sushi Zanmai', 'sushi zanmai', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sushi Zanmai Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sushi zanmai')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Rakuzen Malaysia', 'Rakuzen', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Rakuzen Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rakuzen', 'rakuzen', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rakuzen Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rakuzen')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rakuzen', 'rakuzen', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rakuzen Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rakuzen')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Ichiran Malaysia', 'Ichiran', 'restaurant', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Ichiran Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ichiran', 'ichiran', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ichiran Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ichiran')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ichiran Ramen', 'ichiran ramen', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ichiran Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ichiran ramen')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hoshino Coffee Malaysia', 'Hoshino Coffee', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hoshino Coffee Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hoshino Coffee', 'hoshino coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hoshino Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hoshino coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hoshino', 'hoshino', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hoshino Coffee Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hoshino')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Dome Cafe Malaysia', 'Dome Cafe', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Dome Cafe Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dome Cafe', 'dome cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dome Cafe Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dome cafe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dome', 'dome', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dome Cafe Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dome')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DOME', 'dome', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dome Cafe Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dome')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Drive-Thru', 'Starbucks Drive-Thru', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Drive-Thru')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks Drive-Thru', 'starbucks drive thru', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Drive-Thru' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks drive thru')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gong Cha Malaysia', 'Gong Cha', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gong Cha Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gong Cha', 'gong cha', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gong Cha Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gong cha')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GongCha', 'gongcha', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gong Cha Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gongcha')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GONG CHA', 'gong cha', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gong Cha Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gong cha')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tiger Sugar Malaysia', 'Tiger Sugar', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tiger Sugar Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tiger Sugar', 'tiger sugar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tiger Sugar Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tiger sugar')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tiger Sugar', 'tiger sugar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tiger Sugar Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tiger sugar')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Xing Fu Tang Malaysia', 'Xing Fu Tang', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Xing Fu Tang Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Xing Fu Tang', 'xing fu tang', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xing Fu Tang Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xing fu tang')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Xing Fu Tang', 'xing fu tang', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xing Fu Tang Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xing fu tang')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Daboba Malaysia', 'Daboba', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Daboba Malaysia')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Daboba', 'daboba', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Daboba Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'daboba')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DABOBA', 'daboba', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Daboba Malaysia' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'daboba')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tealive Signature', 'Tealive Signature', 'cafe', 'candidate', 'MY'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tealive Signature')) AND country_code = 'MY');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tealive Signature', 'tealive signature', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tealive Signature' AND m.country_code = 'MY'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tealive signature')
LIMIT 1;
