-- 1. Hapus semua data products, brands, dan conditions biar bersih
TRUNCATE TABLE "products" CASCADE;
TRUNCATE TABLE "brands" CASCADE;
TRUNCATE TABLE "conditions" CASCADE;

-- 2. Pastikan kolom images tipe array (buat jaga-jaga kalau belum terubah)
ALTER TABLE "products" ALTER COLUMN "images" TYPE TEXT[] USING ARRAY[]::TEXT[];

-- 3. Insert Dummy Brands (Khusus Laptop)
INSERT INTO "brands" ("name", "updated_at") VALUES 
('Apple', CURRENT_TIMESTAMP),
('Asus', CURRENT_TIMESTAMP),
('Lenovo', CURRENT_TIMESTAMP),
('HP', CURRENT_TIMESTAMP),
('Dell', CURRENT_TIMESTAMP),
('Acer', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- 4. Insert Dummy Conditions
INSERT INTO "conditions" ("name", "updated_at") VALUES 
('New', CURRENT_TIMESTAMP),
('Second', CURRENT_TIMESTAMP),
('Refurbished', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- 5. Insert Dummy Products (Khusus Laptop)
INSERT INTO "products" (
    "sku", "serial_number", "name", "price", "buy_price", 
    "brand_id", "category", "description", "stock", "images", 
    "specifications", "condition_id", "warranty", "weight", "updated_at"
) VALUES 
(
    'APL-MBA-M3-8256', 'SN-APL-L001', 'MacBook Air M3 13-inch', 18000000, 16500000, 
    (SELECT id FROM "brands" WHERE name = 'Apple'), 'Laptop', 'Apple MacBook Air M3 8GB/256GB Space Gray', 10, ARRAY['https://example.com/mbam3.jpg'], 
    '{"ram": "8GB", "storage": "256GB", "processor": "Apple M3", "display": "13.6-inch Liquid Retina"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year iBox', 1240, CURRENT_TIMESTAMP
),
(
    'APL-MBP-M3M-361T', 'SN-APL-L002', 'MacBook Pro M3 Max 16-inch', 55000000, 50000000, 
    (SELECT id FROM "brands" WHERE name = 'Apple'), 'Laptop', 'Apple MacBook Pro M3 Max 36GB/1TB Space Black', 5, ARRAY['https://example.com/mbpm3max.jpg'], 
    '{"ram": "36GB", "storage": "1TB", "processor": "Apple M3 Max", "display": "16.2-inch Liquid Retina XDR"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year iBox', 2140, CURRENT_TIMESTAMP
),
(
    'ASUS-ROG-G16', 'SN-ASUS-L001', 'Asus ROG Strix G16', 25000000, 23000000, 
    (SELECT id FROM "brands" WHERE name = 'Asus'), 'Laptop', 'Asus ROG Strix G16 (2024) Gaming Laptop', 8, ARRAY['https://example.com/rogg16.jpg'], 
    '{"ram": "16GB", "storage": "1TB", "processor": "Intel Core i7-13650HX", "gpu": "RTX 4060"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Asus', 2500, CURRENT_TIMESTAMP
),
(
    'LEN-LEG-P7I', 'SN-LEN-L001', 'Lenovo Legion Pro 7i', 35000000, 32000000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Lenovo Legion Pro 7i Gen 8 Gaming', 6, ARRAY['https://example.com/legionp7i.jpg'], 
    '{"ram": "32GB", "storage": "1TB", "processor": "Intel Core i9-13900HX", "gpu": "RTX 4080"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Lenovo', 2800, CURRENT_TIMESTAMP
),
(
    'HP-OMEN-16', 'SN-HP-L001', 'HP Omen 16', 22000000, 20000000, 
    (SELECT id FROM "brands" WHERE name = 'HP'), 'Laptop', 'HP Omen 16 Gaming Laptop', 12, ARRAY['https://example.com/hpomen16.jpg'], 
    '{"ram": "16GB", "storage": "512GB", "processor": "AMD Ryzen 7 7840HS", "gpu": "RTX 4060"}', (SELECT id FROM "conditions" WHERE name = 'Second'), 'No Warranty', 2350, CURRENT_TIMESTAMP
),
(
    'DELL-XPS-15', 'SN-DELL-L001', 'Dell XPS 15', 30000000, 27500000, 
    (SELECT id FROM "brands" WHERE name = 'Dell'), 'Laptop', 'Dell XPS 15 9530 Premium Content Creator Laptop', 7, ARRAY['https://example.com/xps15.jpg'], 
    '{"ram": "16GB", "storage": "1TB", "processor": "Intel Core i7-13700H", "gpu": "RTX 4050"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Dell', 1920, CURRENT_TIMESTAMP
),
(
    'ACER-PRED-NEO16', 'SN-ACER-L001', 'Acer Predator Helios Neo 16', 20000000, 18500000, 
    (SELECT id FROM "brands" WHERE name = 'Acer'), 'Laptop', 'Acer Predator Helios Neo 16 Gaming', 15, ARRAY['https://example.com/predatorneo16.jpg'], 
    '{"ram": "16GB", "storage": "512GB", "processor": "Intel Core i5-13500HX", "gpu": "RTX 4050"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Acer', 2600, CURRENT_TIMESTAMP
),
(
    'LEN-TP-X1C', 'SN-LEN-L002', 'Lenovo ThinkPad X1 Carbon Gen 11', 28000000, 26000000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Lenovo ThinkPad X1 Carbon Gen 11 Business Laptop', 10, ARRAY['https://example.com/x1carbon.jpg'], 
    '{"ram": "16GB", "storage": "512GB", "processor": "Intel Core i7-1355U", "display": "14-inch WUXGA"}', (SELECT id FROM "conditions" WHERE name = 'Refurbished'), '1 Year Lenovo', 1120, CURRENT_TIMESTAMP
),
(
    'ASUS-VIVO-GO14', 'SN-ASUS-L002', 'Asus Vivobook Go 14', 6000000, 5200000, 
    (SELECT id FROM "brands" WHERE name = 'Asus'), 'Laptop', 'Asus Vivobook Go 14 E1404FA', 20, ARRAY['https://example.com/vivogo14.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "AMD Ryzen 3 7320U", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Asus', 1380, CURRENT_TIMESTAMP
),
(
    'LEN-IP-SLIM3', 'SN-LEN-L003', 'Lenovo IdeaPad Slim 3', 7500000, 6800000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Lenovo IdeaPad Slim 3 14IAH8', 15, ARRAY['https://example.com/ideapadslim3.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "Intel Core i3-1215U", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Lenovo', 1430, CURRENT_TIMESTAMP
),
(
    'ACER-ASP-5', 'SN-ACER-L002', 'Acer Aspire 5', 8000000, 7100000, 
    (SELECT id FROM "brands" WHERE name = 'Acer'), 'Laptop', 'Acer Aspire 5 A514', 18, ARRAY['https://example.com/aspire5.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "Intel Core i5-1135G7", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Acer', 1450, CURRENT_TIMESTAMP
),
(
    'HP-14S', 'SN-HP-L002', 'HP 14s', 6500000, 5800000, 
    (SELECT id FROM "brands" WHERE name = 'HP'), 'Laptop', 'HP 14s fq1032AU', 25, ARRAY['https://example.com/hp14s.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "AMD Ryzen 3 5300U", "display": "14-inch HD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years HP', 1470, CURRENT_TIMESTAMP
),
(
    'DELL-INSP-15', 'SN-DELL-L002', 'Dell Inspiron 15 3520', 9500000, 8500000, 
    (SELECT id FROM "brands" WHERE name = 'Dell'), 'Laptop', 'Dell Inspiron 15 3520 Business Laptop', 10, ARRAY['https://example.com/inspiron15.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "Intel Core i5-1235U", "display": "15.6-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Dell', 1650, CURRENT_TIMESTAMP
),
(
    'LEN-TP-T480', 'SN-LEN-L004', 'Lenovo ThinkPad T480 (Second)', 4500000, 3500000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Lenovo ThinkPad T480 Business Laptop Second', 12, ARRAY['https://example.com/t480.jpg'], 
    '{"ram": "8GB", "storage": "256GB", "processor": "Intel Core i5-8350U", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'Second'), '1 Month Store', 1600, CURRENT_TIMESTAMP
)
ON CONFLICT ("sku") DO NOTHING;
