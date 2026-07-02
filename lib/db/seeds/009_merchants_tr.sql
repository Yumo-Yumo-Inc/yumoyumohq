-- TR canonical merchants + patterns. Run in Neon SQL Editor after migration 009.
-- Idempotent: safe to run multiple times.

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'BIM Birleşik Mağazalar A.Ş.', 'BIM', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('BIM Birleşik Mağazalar A.Ş.')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIM', 'bim', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bim')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BİM', 'bi m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bi m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'B.I.M', 'b i m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'b i m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIMM', 'bimm', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bimm')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIM Birleşik', 'bim birleşik', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bim birleşik')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIRLEŞIK MAGAZALAR', 'birleşik magazalar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'birleşik magazalar')
LIMIT 1;

-- ASCII-normalized patterns (OCR often produces ASCII instead of Turkish chars)
INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIN BIRLESIK MAGAZALAR', 'bin birlesik magazalar', 'ocr', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bin birlesik magazalar')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIRLESIK MAGAZALAR', 'birlesik magazalar', 'ocr', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'birlesik magazalar')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BIM BIRLESIK', 'bim birlesik', 'ocr', 0.9 FROM merchants m
WHERE m.canonical_name = 'BIM Birleşik Mağazalar A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bim birlesik')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Migros Ticaret A.Ş.', 'Migros', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Migros Ticaret A.Ş.')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros', 'migros', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MİGROS', 'mi gros', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mi gros')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MIGROS', 'migros', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'A101 Yeni Mağazacılık A.Ş.', 'A101', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('A101 Yeni Mağazacılık A.Ş.')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'A101', 'a101', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'A101 Yeni Mağazacılık A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'a101')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'A 101', 'a 101', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'A101 Yeni Mağazacılık A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'a 101')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Şok Marketler Ticaret A.Ş.', 'Şok Market', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Şok Marketler Ticaret A.Ş.')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ŞOK', 'şok', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Şok Marketler Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'şok')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SOK', 'sok', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Şok Marketler Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sok')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Şok', 'şok', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Şok Marketler Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'şok')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sok Market', 'sok market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Şok Marketler Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sok market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ŞOK MARKET', 'şok market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Şok Marketler Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'şok market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.', 'CarrefourSA', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CarrefourSA', 'carrefoursa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefoursa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Carrefour', 'carrefour', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefour')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CARREFOUR', 'carrefour', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefour')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Carrefour SA', 'carrefour sa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefour sa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Teknosa İç ve Dış Ticaret A.Ş.', 'Teknosa', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Teknosa İç ve Dış Ticaret A.Ş.')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Teknosa', 'teknosa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Teknosa İç ve Dış Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'teknosa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TEKNOSA', 'teknosa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Teknosa İç ve Dış Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'teknosa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tekno Sa', 'tekno sa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Teknosa İç ve Dış Ticaret A.Ş.' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tekno sa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vatan Bilgisayar', 'Vatan Bilgisayar', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vatan Bilgisayar')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vatan', 'vatan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vatan Bilgisayar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vatan')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vatan Bilgisayar', 'vatan bilgisayar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vatan Bilgisayar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vatan bilgisayar')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VATAN', 'vatan', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vatan Bilgisayar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vatan')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Media Markt Turkey', 'Media Markt', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Media Markt Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Media Markt', 'media markt', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Media Markt Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'media markt')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MediaMarkt', 'mediamarkt', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Media Markt Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mediamarkt')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MEDIA MARKT', 'media markt', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Media Markt Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'media markt')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Starbucks Coffee', 'Starbucks', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Starbucks Coffee')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Coffee' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'STARBUCKS', 'starbucks', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Coffee' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Starbucks Coffee', 'starbucks coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Starbucks Coffee' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'starbucks coffee')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Kahve Dünyası', 'Kahve Dünyası', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Kahve Dünyası')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kahve Dünyası', 'kahve dünyası', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kahve Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kahve dünyası')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kahve Dunyasi', 'kahve dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kahve Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kahve dunyasi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KAHVE DUNYASI', 'kahve dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kahve Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kahve dunyasi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Simit Sarayı', 'Simit Sarayı', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Simit Sarayı')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Simit Sarayı', 'simit sarayı', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Simit Sarayı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'simit sarayı')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Simit Sarayi', 'simit sarayi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Simit Sarayı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'simit sarayi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SIMIT SARAYI', 'simit sarayi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Simit Sarayı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'simit sarayi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Shell Turkey', 'Shell', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Shell Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Shell', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SHELL', 'shell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Shell Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'shell')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'BP Turkey', 'BP', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('BP Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BP', 'bp', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BP Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bp')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'bp', 'bp', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'BP Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bp')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Opet', 'Opet', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Opet')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Opet', 'opet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Opet' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'opet')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'OPET', 'opet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Opet' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'opet')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Trendyol', 'Trendyol', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Trendyol')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Trendyol', 'trendyol', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Trendyol' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'trendyol')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TRENDYOL', 'trendyol', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Trendyol' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'trendyol')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hepsiburada', 'Hepsiburada', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hepsiburada')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hepsiburada', 'hepsiburada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hepsiburada' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hepsiburada')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HEPSIBURADA', 'hepsiburada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hepsiburada' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hepsiburada')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hepsi Burada', 'hepsi burada', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hepsiburada' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hepsi burada')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Getir', 'Getir', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Getir')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Getir', 'getir', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Getir' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'getir')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GETIR', 'getir', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Getir' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'getir')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Yemeksepeti', 'Yemeksepeti', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Yemeksepeti')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yemeksepeti', 'yemeksepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yemeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yemeksepeti')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yemek Sepeti', 'yemek sepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yemeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yemek sepeti')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'YEMEKSEPETI', 'yemeksepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yemeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yemeksepeti')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Metro Gross Market', 'Metro', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Metro Gross Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Metro', 'metro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Metro Gross Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'metro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'METRO', 'metro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Metro Gross Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'metro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Metro Gross', 'metro gross', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Metro Gross Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'metro gross')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Real Market', 'Real', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Real Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Real', 'real', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Real Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'real')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'REAL', 'real', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Real Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'real')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Real Market', 'real market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Real Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'real market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'N11.com', 'N11', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('N11.com')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'N11', 'n11', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'N11.com' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'n11')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'n11', 'n11', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'N11.com' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'n11')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'N11.com', 'n11 com', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'N11.com' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'n11 com')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'GittiGidiyor', 'GittiGidiyor', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('GittiGidiyor')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GittiGidiyor', 'gittigidiyor', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GittiGidiyor' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gittigidiyor')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gitti Gidiyor', 'gitti gidiyor', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GittiGidiyor' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gitti gidiyor')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GITTIGIDIYOR', 'gittigidiyor', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GittiGidiyor' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gittigidiyor')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Çiçeksepeti', 'Çiçeksepeti', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Çiçeksepeti')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Çiçeksepeti', 'çiçeksepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çiçeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'çiçeksepeti')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ciceksepeti', 'ciceksepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çiçeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ciceksepeti')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Çiçek Sepeti', 'çiçek sepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çiçeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'çiçek sepeti')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CIÇEKSEPETI', 'ciçeksepeti', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çiçeksepeti' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ciçeksepeti')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Turkcell', 'Turkcell', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Turkcell')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Turkcell', 'turkcell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Turkcell' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turkcell')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TURKCELL', 'turkcell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Turkcell' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turkcell')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Turk Cell', 'turk cell', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Turkcell' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turk cell')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vodafone Turkey', 'Vodafone', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vodafone Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vodafone', 'vodafone', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vodafone Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vodafone')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VODAFONE', 'vodafone', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vodafone Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vodafone')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Türk Telekom', 'Türk Telekom', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Türk Telekom')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Türk Telekom', 'türk telekom', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türk Telekom' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'türk telekom')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Turk Telekom', 'turk telekom', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türk Telekom' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turk telekom')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TURK TELEKOM', 'turk telekom', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türk Telekom' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turk telekom')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TT', 'tt', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türk Telekom' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tt')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'McDonald''s Turkey', 'McDonald''s', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('McDonald''s Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald''s', 'mcdonald s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonalds', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MCDONALDS', 'mcdonalds', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonalds')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'McDonald', 'mcdonald', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'McDonald''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mcdonald')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Burger King Turkey', 'Burger King', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Burger King Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Burger King', 'burger king', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burger King Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'burger king')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BURGER KING', 'burger king', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burger King Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'burger king')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BK', 'bk', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burger King Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bk')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'KFC Turkey', 'KFC', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('KFC Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KFC', 'kfc', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kfc')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kentucky', 'kentucky', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'KFC Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kentucky')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Domino''s Pizza Turkey', 'Domino''s Pizza', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Domino''s Pizza Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Domino''s', 'domino s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'domino s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dominos', 'dominos', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DOMINOS PIZZA', 'dominos pizza', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Domino''s Pizza Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dominos pizza')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pizza Hut Turkey', 'Pizza Hut', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pizza Hut Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pizza Hut', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PIZZA HUT', 'pizza hut', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pizza Hut Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pizza hut')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Subway Turkey', 'Subway', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Subway Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Subway', 'subway', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Subway Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'subway')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SUBWAY', 'subway', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Subway Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'subway')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gloria Jean''s Turkey', 'Gloria Jean''s', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gloria Jean''s Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gloria Jean''s', 'gloria jean s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gloria Jean''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gloria jean s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gloria Jeans', 'gloria jeans', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gloria Jean''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gloria jeans')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GLORIA JEANS', 'gloria jeans', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gloria Jean''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gloria jeans')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Costa Coffee Turkey', 'Costa Coffee', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Costa Coffee Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Costa Coffee', 'costa coffee', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Costa Coffee Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'costa coffee')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Costa', 'costa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Costa Coffee Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'costa')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'COSTA', 'costa', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Costa Coffee Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'costa')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Caffe Nero Turkey', 'Caffe Nero', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Caffe Nero Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Caffe Nero', 'caffe nero', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caffe Nero Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caffe nero')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Caffe Nero', 'caffe nero', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caffe Nero Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caffe nero')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CAFFE NERO', 'caffe nero', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Caffe Nero Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'caffe nero')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mado', 'Mado', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mado')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mado', 'mado', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mado' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mado')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MADO', 'mado', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mado' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mado')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Baydoner', 'Baydoner', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Baydoner')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Baydoner', 'baydoner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baydoner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'baydoner')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BAYDONER', 'baydoner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baydoner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'baydoner')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bay Döner', 'bay döner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baydoner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bay döner')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hesburger Turkey', 'Hesburger', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hesburger Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hesburger', 'hesburger', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hesburger Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hesburger')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HESBURGER', 'hesburger', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hesburger Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hesburger')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Popeyes Turkey', 'Popeyes', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Popeyes Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Popeyes', 'popeyes', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Popeyes Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'popeyes')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'POPEYES', 'popeyes', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Popeyes Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'popeyes')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tavuk Dünyası', 'Tavuk Dünyası', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tavuk Dünyası')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tavuk Dünyası', 'tavuk dünyası', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tavuk Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tavuk dünyası')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tavuk Dunyasi', 'tavuk dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tavuk Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tavuk dunyasi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TAVUK DUNYASI', 'tavuk dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tavuk Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tavuk dunyasi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Petrol Ofisi', 'Petrol Ofisi', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Petrol Ofisi')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Petrol Ofisi', 'petrol ofisi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petrol Ofisi' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'petrol ofisi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Petrol Ofisi', 'petrol ofisi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petrol Ofisi' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'petrol ofisi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PO', 'po', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petrol Ofisi' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'po')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PETROL OFISI', 'petrol ofisi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Petrol Ofisi' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'petrol ofisi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Total Turkey', 'Total', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Total Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Total', 'total', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Total Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'total')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TOTAL', 'total', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Total Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'total')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'M Oil', 'M Oil', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('M Oil')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'M Oil', 'm oil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'M Oil' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'm oil')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MOIL', 'moil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'M Oil' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'moil')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'M-Oil', 'm oil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'M Oil' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'm oil')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lukoil Turkey', 'Lukoil', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lukoil Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lukoil', 'lukoil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lukoil Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lukoil')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LUKOIL', 'lukoil', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lukoil Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lukoil')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'D&R', 'D&R', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('D&R')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'D&R', 'd r', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'D&R' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'd r')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'D ve R', 'd ve r', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'D&R' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'd ve r')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'D&R Kültür', 'd r kültür', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'D&R' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'd r kültür')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'İnce Hesap', 'İnce Hesap', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('İnce Hesap')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'İnce Hesap', 'i nce hesap', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İnce Hesap' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'i nce hesap')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ince Hesap', 'ince hesap', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İnce Hesap' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ince hesap')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'INCE HESAP', 'ince hesap', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İnce Hesap' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ince hesap')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'GameStop Turkey', 'GameStop', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('GameStop Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GameStop', 'gamestop', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GameStop Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gamestop')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GAMESTOP', 'gamestop', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'GameStop Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gamestop')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Apple Store Turkey', 'Apple Store', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Apple Store Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Apple Store', 'apple store', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple store')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Apple', 'apple', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'APPLE', 'apple', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Apple Store Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'apple')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Samsung Turkey', 'Samsung', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Samsung Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Samsung', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SAMSUNG', 'samsung', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Samsung Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'samsung')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Xiaomi Turkey', 'Xiaomi', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Xiaomi Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Xiaomi', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'XIAOMI', 'xiaomi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Xiaomi Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'xiaomi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Huawei Turkey', 'Huawei', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Huawei Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Huawei', 'huawei', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Huawei Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'huawei')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HUAWEI', 'huawei', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Huawei Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'huawei')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Migros Sanal Market', 'Migros Sanal Market', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Migros Sanal Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros Sanal', 'migros sanal', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Sanal Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros sanal')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros Sanal Market', 'migros sanal market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Sanal Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros sanal market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'CarrefourSA Sanal Market', 'CarrefourSA Sanal', 'marketplace', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('CarrefourSA Sanal Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CarrefourSA Sanal', 'carrefoursa sanal', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CarrefourSA Sanal Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefoursa sanal')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Carrefour Sanal', 'carrefour sanal', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'CarrefourSA Sanal Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carrefour sanal')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hakmar', 'Hakmar', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hakmar')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hakmar', 'hakmar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hakmar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hakmar')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HAKMAR', 'hakmar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hakmar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hakmar')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Onur Market', 'Onur Market', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Onur Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Onur Market', 'onur market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Onur Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'onur market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Onur', 'onur', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Onur Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'onur')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ONUR MARKET', 'onur market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Onur Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'onur market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gross Market', 'Gross Market', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gross Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gross Market', 'gross market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gross Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gross market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gross', 'gross', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gross Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gross')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GROSS', 'gross', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gross Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gross')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'İstanbul Halk Ekmek', 'Halk Ekmek', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('İstanbul Halk Ekmek')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Halk Ekmek', 'halk ekmek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İstanbul Halk Ekmek' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'halk ekmek')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Halk Ekmek', 'halk ekmek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İstanbul Halk Ekmek' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'halk ekmek')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HALK EKMEK', 'halk ekmek', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İstanbul Halk Ekmek' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'halk ekmek')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Ekomini', 'Ekomini', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Ekomini')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ekomini', 'ekomini', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ekomini' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ekomini')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'EKOMINI', 'ekomini', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Ekomini' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ekomini')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sok Market', 'Sok', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sok Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sok', 'sok', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sok Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sok')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SOK', 'sok', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sok Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sok')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sok Market', 'sok market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sok Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sok market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bauhaus Turkey', 'Bauhaus', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bauhaus Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bauhaus', 'bauhaus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bauhaus Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bauhaus')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BAUHAUS', 'bauhaus', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bauhaus Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bauhaus')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'IKEA Turkey', 'IKEA', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('IKEA Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IKEA', 'ikea', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IKEA Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ikea')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Ikea', 'ikea', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IKEA Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ikea')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'English Home', 'English Home', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('English Home')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'English Home', 'english home', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'English Home' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'english home')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ENGLISH HOME', 'english home', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'English Home' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'english home')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'LC Waikiki', 'LC Waikiki', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('LC Waikiki')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LC Waikiki', 'lc waikiki', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'LC Waikiki' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lc waikiki')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LCW', 'lcw', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'LC Waikiki' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lcw')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LC WAIKIKI', 'lc waikiki', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'LC Waikiki' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lc waikiki')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Koton', 'Koton', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Koton')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Koton', 'koton', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Koton' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'koton')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KOTON', 'koton', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Koton' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'koton')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'DeFacto', 'DeFacto', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('DeFacto')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DeFacto', 'defacto', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'DeFacto' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'defacto')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Defacto', 'defacto', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'DeFacto' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'defacto')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DEFACTO', 'defacto', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'DeFacto' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'defacto')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Colin''s', 'Colin''s', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Colin''s')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Colin''s', 'colin s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Colin''s' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'colin s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Colins', 'colins', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Colin''s' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'colins')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'COLINS', 'colins', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Colin''s' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'colins')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Network', 'Network', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Network')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Network', 'network', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Network' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'network')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NETWORK', 'network', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Network' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'network')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Flormar', 'Flormar', 'beauty', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Flormar')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Flormar', 'flormar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Flormar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'flormar')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FLORMAR', 'flormar', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Flormar' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'flormar')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sephora Turkey', 'Sephora', 'beauty', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sephora Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sephora', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SEPHORA', 'sephora', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sephora Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sephora')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Watsons Turkey', 'Watsons', 'pharmacy', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Watsons Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watsons', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'WATSONS', 'watsons', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Watsons Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons')
LIMIT 1;

-- Güz ve Bak Ür. Tic. A.Ş. = Watsons Turkey (Land of Legends vb. şubeler)
INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GUZ VE BAK UR. TIC. A.S.', 'guz ve bak ur tic a s', 'exact', 0.95 FROM merchants m
WHERE m.canonical_name = 'Watsons Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guz ve bak ur tic a s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GUZ VE BAK', 'guz ve bak', 'exact', 0.95 FROM merchants m
WHERE m.canonical_name = 'Watsons Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'guz ve bak')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Watsons, Land of Legends Şubesi', 'watsons land of legends şubesi', 'exact', 0.95 FROM merchants m
WHERE m.canonical_name = 'Watsons Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'watsons land of legends şubesi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Gratis', 'Gratis', 'beauty', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Gratis')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Gratis', 'gratis', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gratis' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gratis')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'GRATIS', 'gratis', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Gratis' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'gratis')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Rossmann Turkey', 'Rossmann', 'pharmacy', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Rossmann Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Rossmann', 'rossmann', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rossmann Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rossmann')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ROSSMANN', 'rossmann', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Rossmann Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'rossmann')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Derman Pharmacy', 'Derman Eczanesi', 'pharmacy', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Derman Pharmacy')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Derman', 'derman', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Derman Pharmacy' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'derman')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Derman Eczanesi', 'derman eczanesi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Derman Pharmacy' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'derman eczanesi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Migros Jet', 'Migros Jet', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Migros Jet')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros Jet', 'migros jet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Jet' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros jet')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MigrosJet', 'migrosjet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Jet' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migrosjet')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'JET', 'jet', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Jet' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'jet')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Çarşı Market', 'Çarşı', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Çarşı Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Çarşı', 'çarşı', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çarşı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'çarşı')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Carşı', 'carşı', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çarşı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carşı')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CARSI', 'carsi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çarşı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'carsi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Çarşı Market', 'çarşı market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çarşı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'çarşı market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tanzania Coffee', 'Tanzania', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tanzania Coffee')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tanzania', 'tanzania', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tanzania Coffee' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tanzania')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TANZANIA', 'tanzania', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tanzania Coffee' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tanzania')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Kahve Diyarı', 'Kahve Diyarı', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Kahve Diyarı')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kahve Diyarı', 'kahve diyarı', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kahve Diyarı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kahve diyarı')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kahve Diyari', 'kahve diyari', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Kahve Diyarı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kahve diyari')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Fazıl Bey', 'Fazıl Bey', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Fazıl Bey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Fazıl Bey', 'fazıl bey', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fazıl Bey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fazıl bey')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Fazil Bey', 'fazil bey', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fazıl Bey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fazil bey')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'FAZIL BEY', 'fazil bey', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Fazıl Bey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'fazil bey')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Simit Dünyası', 'Simit Dünyası', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Simit Dünyası')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Simit Dünyası', 'simit dünyası', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Simit Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'simit dünyası')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Simit Dunyasi', 'simit dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Simit Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'simit dunyasi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Dürüm Dünyası', 'Dürüm Dünyası', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Dürüm Dünyası')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dürüm Dünyası', 'dürüm dünyası', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dürüm Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dürüm dünyası')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Durum Dunyasi', 'durum dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dürüm Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'durum dunyasi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Köfteci Yusuf', 'Köfteci Yusuf', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Köfteci Yusuf')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Köfteci Yusuf', 'köfteci yusuf', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Köfteci Yusuf' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'köfteci yusuf')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Kofteci Yusuf', 'kofteci yusuf', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Köfteci Yusuf' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kofteci yusuf')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KOFTECI YUSUF', 'kofteci yusuf', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Köfteci Yusuf' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'kofteci yusuf')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Baba Döner', 'Baba Döner', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Baba Döner')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Baba Döner', 'baba döner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baba Döner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'baba döner')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Baba Doner', 'baba doner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Baba Döner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'baba doner')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Burger House', 'Burger House', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Burger House')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Burger House', 'burger house', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burger House' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'burger house')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BURGER HOUSE', 'burger house', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Burger House' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'burger house')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sözlük Cafe', 'Sözlük Cafe', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sözlük Cafe')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sözlük Cafe', 'sözlük cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sözlük Cafe' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sözlük cafe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sozluk Cafe', 'sozluk cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sözlük Cafe' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sozluk cafe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Dolce Vita', 'Dolce Vita', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Dolce Vita')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dolce Vita', 'dolce vita', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dolce Vita' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dolce vita')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DOLCE VITA', 'dolce vita', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dolce Vita' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dolce vita')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Papa John''s Turkey', 'Papa John''s', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Papa John''s Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Papa John''s', 'papa john s', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa John''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa john s')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Papa Johns', 'papa johns', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa John''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa johns')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PAPA JOHNS', 'papa johns', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Papa John''s Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'papa johns')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Little Caesars Turkey', 'Little Caesars', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Little Caesars Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Little Caesars', 'little caesars', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Little Caesars Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'little caesars')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LITTLE CAESARS', 'little caesars', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Little Caesars Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'little caesars')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Sbarro Turkey', 'Sbarro', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Sbarro Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Sbarro', 'sbarro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sbarro Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sbarro')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'SBARRO', 'sbarro', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Sbarro Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'sbarro')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Dunkin'' Turkey', 'Dunkin''', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Dunkin'' Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dunkin''', 'dunkin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dunkin'' Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dunkin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dunkin', 'dunkin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dunkin'' Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dunkin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DUNKIN', 'dunkin', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dunkin'' Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dunkin')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Dunkin Donuts', 'dunkin donuts', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Dunkin'' Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'dunkin donuts')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Cinnabon Turkey', 'Cinnabon', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Cinnabon Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cinnabon', 'cinnabon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cinnabon Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cinnabon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CINNABON', 'cinnabon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Cinnabon Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cinnabon')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mado Cafe', 'Mado Cafe', 'cafe', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mado Cafe')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mado Cafe', 'mado cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mado Cafe' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mado cafe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MADO CAFE', 'mado cafe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mado Cafe' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mado cafe')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Decathlon Turkey', 'Decathlon', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Decathlon Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Decathlon', 'decathlon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Decathlon Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'decathlon')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'DECATHLON', 'decathlon', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Decathlon Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'decathlon')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Adidas Turkey', 'Adidas', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Adidas Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Adidas', 'adidas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Adidas Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'adidas')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ADIDAS', 'adidas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Adidas Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'adidas')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Nike Turkey', 'Nike', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Nike Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Nike', 'nike', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nike Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nike')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NIKE', 'nike', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Nike Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'nike')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Puma Turkey', 'Puma', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Puma Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Puma', 'puma', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Puma Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'puma')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PUMA', 'puma', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Puma Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'puma')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'New Balance Turkey', 'New Balance', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('New Balance Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'New Balance', 'new balance', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'New Balance Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'new balance')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'NEW BALANCE', 'new balance', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'New Balance Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'new balance')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Mavi', 'Mavi', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Mavi')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Mavi', 'mavi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mavi' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mavi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MAVI', 'mavi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Mavi' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mavi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lotto Turkey', 'Lotto', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lotto Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lotto', 'lotto', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotto Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotto')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LOTTO', 'lotto', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lotto Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lotto')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Beymen', 'Beymen', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Beymen')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Beymen', 'beymen', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Beymen' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'beymen')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BEYMEN', 'beymen', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Beymen' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'beymen')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Boyner', 'Boyner', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Boyner')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Boyner', 'boyner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boyner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boyner')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BOYNER', 'boyner', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Boyner' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'boyner')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Yataş', 'Yataş', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Yataş')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yataş', 'yataş', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yataş' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yataş')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Yatas', 'yatas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yataş' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yatas')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'YATAS', 'yatas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Yataş' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'yatas')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'İstikbal', 'İstikbal', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('İstikbal')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'İstikbal', 'i stikbal', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İstikbal' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'i stikbal')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Istikbal', 'istikbal', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İstikbal' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'istikbal')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ISTIKBAL', 'istikbal', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'İstikbal' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'istikbal')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Bellona', 'Bellona', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Bellona')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Bellona', 'bellona', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bellona' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bellona')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BELLONA', 'bellona', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Bellona' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'bellona')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Lufian', 'Lufian', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Lufian')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Lufian', 'lufian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lufian' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lufian')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'LUFIAN', 'lufian', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Lufian' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'lufian')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Karaca', 'Karaca', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Karaca')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Karaca', 'karaca', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Karaca' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'karaca')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KARACA', 'karaca', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Karaca' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'karaca')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Pasabahce', 'Paşabahçe', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Pasabahce')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Paşabahçe', 'paşabahçe', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pasabahce' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'paşabahçe')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Pasabahce', 'pasabahce', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pasabahce' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pasabahce')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'PASABAHCE', 'pasabahce', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Pasabahce' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'pasabahce')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tupperware Turkey', 'Tupperware', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tupperware Turkey')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tupperware', 'tupperware', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tupperware Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tupperware')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TUPPERWARE', 'tupperware', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tupperware Turkey' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tupperware')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Çağdaş Market', 'Çağdaş', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Çağdaş Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Çağdaş', 'çağdaş', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çağdaş Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'çağdaş')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Cagdas', 'cagdas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çağdaş Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cagdas')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'CAGDAS', 'cagdas', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Çağdaş Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'cagdas')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Happy Center', 'Happy Center', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Happy Center')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Happy Center', 'happy center', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Happy Center' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'happy center')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HAPPY CENTER', 'happy center', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Happy Center' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'happy center')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Migros Express', 'Migros Express', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Migros Express')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros Express', 'migros express', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Express' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros express')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros Express', 'migros express', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros Express' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros express')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Türkiye Petrol Rafinerileri', 'Tüpraş', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Türkiye Petrol Rafinerileri')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tüpraş', 'tüpraş', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türkiye Petrol Rafinerileri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tüpraş')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tupras', 'tupras', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türkiye Petrol Rafinerileri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tupras')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TUPRAS', 'tupras', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Türkiye Petrol Rafinerileri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tupras')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Migros 5M', '5M Migros', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Migros 5M')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '5M', '5m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros 5M' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '5m')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, '5M Migros', '5m migros', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros 5M' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = '5m migros')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Migros 5M', 'migros 5m', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Migros 5M' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'migros 5m')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Efsane Unlu Mamülleri', 'Efsane Unlu Mamülleri', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Efsane Unlu Mamülleri')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Efsane Unlu Mamülleri', 'efsane unlu mamülleri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Efsane Unlu Mamülleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'efsane unlu mamülleri')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Efsane Unlu Mamulleri', 'efsane unlu mamulleri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Efsane Unlu Mamülleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'efsane unlu mamulleri')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'EFSANE UNLU MAMULLERI', 'efsane unlu mamulleri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Efsane Unlu Mamülleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'efsane unlu mamulleri')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Eşarf Dünyası', 'Eşarf Dünyası', 'apparel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Eşarf Dünyası')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Eşarf Dünyası', 'eşarf dünyası', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Eşarf Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'eşarf dünyası')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Eşarp Dünyası', 'eşarp dünyası', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Eşarf Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'eşarp dünyası')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Esarf Dunyasi', 'esarf dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Eşarf Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'esarf dunyasi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ESARF DUNYASI', 'esarf dunyasi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Eşarf Dünyası' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'esarf dunyasi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'MR.DIY Ev Gereçleri ve Yapı Malzemeleri', 'MR. D.I.Y', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('MR.DIY Ev Gereçleri ve Yapı Malzemeleri')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MR. D.I.Y', 'mr d i y', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Ev Gereçleri ve Yapı Malzemeleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mr d i y')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MR.DIY', 'mr diy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Ev Gereçleri ve Yapı Malzemeleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mr diy')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MR DIY', 'mr diy', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Ev Gereçleri ve Yapı Malzemeleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mr diy')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MRDİY', 'mrdi y', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Ev Gereçleri ve Yapı Malzemeleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mrdi y')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MR DIY Turkey', 'mr diy turkey', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'MR.DIY Ev Gereçleri ve Yapı Malzemeleri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'mr diy turkey')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Turkuvaz Müzik Kitap', 'Turkuvaz Müzik Kitap', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Turkuvaz Müzik Kitap')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TURKUVAZ MÜZİK KİTAP', 'turkuvaz müzi k ki tap', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Turkuvaz Müzik Kitap' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turkuvaz müzi k ki tap')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Turkuvaz Müzik Kitap', 'turkuvaz müzik kitap', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Turkuvaz Müzik Kitap' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turkuvaz müzik kitap')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Turkuvaz Muzik Kitap', 'turkuvaz muzik kitap', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Turkuvaz Müzik Kitap' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'turkuvaz muzik kitap')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Hazal Market', 'Hazal Market', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Hazal Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Hazal Market', 'hazal market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hazal Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hazal market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'HAZAL MARKET', 'hazal market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Hazal Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'hazal market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Enes Kitap Sarayı', 'Enes Kitap Sarayı', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Enes Kitap Sarayı')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Enes Kitap Sarayı', 'enes kitap sarayı', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Enes Kitap Sarayı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'enes kitap sarayı')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Enes Kitap Sarayi', 'enes kitap sarayi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Enes Kitap Sarayı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'enes kitap sarayi')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ENES KITAP SARAYI', 'enes kitap sarayi', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Enes Kitap Sarayı' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'enes kitap sarayi')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Zirve Kırtasiye', 'Zirve Kırtasiye', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Zirve Kırtasiye')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zirve Kırtasiye', 'zirve kırtasiye', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zirve Kırtasiye' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zirve kırtasiye')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Zirve Kirtasiye', 'zirve kirtasiye', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zirve Kırtasiye' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zirve kirtasiye')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'ZIRVE KIRTASIYE', 'zirve kirtasiye', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Zirve Kırtasiye' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'zirve kirtasiye')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'IPEX Kestane Şekeri', 'IPEX Kestane Şekeri', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('IPEX Kestane Şekeri')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IPEX KESTANE ŞEKERİ', 'ipex kestane şekeri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IPEX Kestane Şekeri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ipex kestane şekeri')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IPEX Kestane Şekeri', 'ipex kestane şekeri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IPEX Kestane Şekeri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ipex kestane şekeri')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'IPEX Kestane Sekeri', 'ipex kestane sekeri', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'IPEX Kestane Şekeri' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'ipex kestane sekeri')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Badem Gıda', 'Badem Gıda', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Badem Gıda')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Badem Gıda', 'badem gıda', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Badem Gıda' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'badem gıda')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Badem Gida', 'badem gida', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Badem Gıda' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'badem gida')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'BADEM GIDA', 'badem gida', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Badem Gıda' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'badem gida')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Malkoç Odun Kömür Gıda', 'Malkoç Odun Kömür', 'fuel', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Malkoç Odun Kömür Gıda')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'MALKOÇ ODUN KÖMÜR GIDA', 'malkoç odun kömür gida', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Malkoç Odun Kömür Gıda' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'malkoç odun kömür gida')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Malkoç Odun Kömür', 'malkoç odun kömür', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Malkoç Odun Kömür Gıda' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'malkoç odun kömür')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Malkoc Odun Komur Gida', 'malkoc odun komur gida', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Malkoç Odun Kömür Gıda' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'malkoc odun komur gida')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Komagene Çiğ Köfte', 'Komagene', 'restaurant', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Komagene Çiğ Köfte')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'KOMAGENE', 'komagene', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Komagene Çiğ Köfte' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'komagene')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Komagene', 'komagene', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Komagene Çiğ Köfte' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'komagene')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Komagene Çiğ Köfte', 'komagene çiğ köfte', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Komagene Çiğ Köfte' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'komagene çiğ köfte')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Aykar Market', 'Aykar Market', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Aykar Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AYKAR MARKET', 'aykar market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Aykar Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aykar market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Aykar Market', 'aykar market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Aykar Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'aykar market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Tatmio Natural Products', 'Tatmio', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Tatmio Natural Products')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'TATMIO NATURAL PRODUCTS', 'tatmio natural products', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tatmio Natural Products' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tatmio natural products')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tatmio Natural Products', 'tatmio natural products', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tatmio Natural Products' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tatmio natural products')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Tatmio', 'tatmio', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Tatmio Natural Products' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'tatmio')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Vestel Elektronik', 'Vestel', 'electronics', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Vestel Elektronik')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'VESTEL', 'vestel', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vestel Elektronik' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vestel')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vestel', 'vestel', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vestel Elektronik' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vestel')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Vestel Elektronik', 'vestel elektronik', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Vestel Elektronik' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'vestel elektronik')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Akin Et', 'Akin Et', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Akin Et')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AKIN ET', 'akin et', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Akin Et' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'akin et')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Akin Et', 'akin et', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Akin Et' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'akin et')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Akin Et Market', 'akin et market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Akin Et' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'akin et market')
LIMIT 1;

INSERT INTO merchants (canonical_name, display_name, category, tier, country_code)
SELECT 'Avcı Market', 'Avcı Market', 'supermarket', 'candidate', 'TR'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE LOWER(TRIM(canonical_name)) = LOWER(TRIM('Avcı Market')) AND country_code = 'TR');

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'AVCI MARKET', 'avci market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Avcı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'avci market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Avcı Market', 'avcı market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Avcı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'avcı market')
LIMIT 1;

INSERT INTO merchant_patterns (merchant_id, pattern, normalized_pattern, pattern_type, confidence_score)
SELECT m.id, 'Avci Market', 'avci market', 'exact', 0.9 FROM merchants m
WHERE m.canonical_name = 'Avcı Market' AND m.country_code = 'TR'
AND NOT EXISTS (SELECT 1 FROM merchant_patterns mp WHERE mp.merchant_id = m.id AND LOWER(TRIM(COALESCE(mp.normalized_pattern, mp.pattern))) = 'avci market')
LIMIT 1;
