-- Quest başlıklarını açık Türkçe ile güncelle
-- Neon SQL Editor'da çalıştır

UPDATE quest_templates SET title = 'Günlük giriş yap'                WHERE type = 'D1';
UPDATE quest_templates SET title = '1 farklı kategoriden fiş tara'    WHERE type = 'D3';
UPDATE quest_templates SET title = '2 farklı kategoriden fiş tara'    WHERE type = 'D4';
UPDATE quest_templates SET title = 'Gizli maliyetli ürün bul'         WHERE type = 'D5';
UPDATE quest_templates SET title = 'Gizli maliyetli fiş tara'         WHERE type = 'D6';
UPDATE quest_templates SET title = 'Yeni bir mağazadan fiş tara'      WHERE type = 'D7';
UPDATE quest_templates SET title = '2 farklı mağazadan fiş tara'      WHERE type = 'D8';
UPDATE quest_templates SET title = 'Bugün en az 1 fiş yükle'          WHERE type = 'D9';
