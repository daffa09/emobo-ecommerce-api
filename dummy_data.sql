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
    "brand_id", "category", "description", "images", 
    "specifications", "condition_id", "warranty", "weight", "updated_at"
) VALUES 
(
    'APL-MBA-M3-8256', 'SN-APL-L001', 'MacBook Air M3 13-inch', 18000000, 16500000, 
    (SELECT id FROM "brands" WHERE name = 'Apple'), 'Laptop', 'MacBook Air 13 inci dengan chip M3 super cepat ini sangat portabel dan memberikan performa luar biasa dalam desain super tipis. Dilengkapi layar Liquid Retina 13,6 inci yang memukau, kamera FaceTime HD 1080p, dan baterai yang tahan hingga 18 jam, laptop ini siap menemani produktivitas dan kreativitas Anda sepanjang hari tanpa henti. Memori terpadu 8GB dan penyimpanan SSD 256GB memastikan responsivitas tingkat tinggi untuk multitasking.', ARRAY['/laptops/APL-MBA-M3-8256.png'], 
    '{"ram": "8GB", "storage": "256GB", "processor": "Apple M3", "display": "13.6-inch Liquid Retina"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year iBox', 1240, CURRENT_TIMESTAMP
),
(
    'APL-MBP-M3M-361T', 'SN-APL-L002', 'MacBook Pro M3 Max 16-inch', 55000000, 50000000, 
    (SELECT id FROM "brands" WHERE name = 'Apple'), 'Laptop', 'Rasakan tenaga buas dari chip Apple M3 Max dengan MacBook Pro 16 inci. Didesain khusus untuk para profesional, laptop ini menawarkan performa grafis tak tertandingi dan kapabilitas rendering tingkat studio. Layar Liquid Retina XDR 16,2 inci memberikan rentang dinamis ekstrem dan warna cerah yang sangat akurat. Dengan RAM 36GB dan penyimpanan SSD 1TB, perangkat ini siap melibas beban kerja paling berat sekalipun, dari editing video 8K hingga simulasi 3D kompleks.', ARRAY['/laptops/APL-MBP-M3M-361T.png'], 
    '{"ram": "36GB", "storage": "1TB", "processor": "Apple M3 Max", "display": "16.2-inch Liquid Retina XDR"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year iBox', 2140, CURRENT_TIMESTAMP
),
(
    'ASUS-ROG-G16', 'SN-ASUS-L001', 'Asus ROG Strix G16', 25000000, 23000000, 
    (SELECT id FROM "brands" WHERE name = 'Asus'), 'Laptop', 'Tingkatkan dominasi gaming Anda dengan ASUS ROG Strix G16 (2024). Ditenagai oleh prosesor Intel Core i7-13650HX generasi ke-13 dan kartu grafis NVIDIA GeForce RTX 4060, laptop ini dirancang untuk memberikan frame rate tinggi pada game AAA modern. Sistem pendingin cerdas ROG Intelligent Cooling dengan liquid metal memastikan suhu tetap terjaga meski dalam sesi gaming maraton. Layar refresh rate tinggi memberikan visual super mulus dan responsif.', ARRAY['/laptops/ASUS-ROG-G16.png'], 
    '{"ram": "16GB", "storage": "1TB", "processor": "Intel Core i7-13650HX", "gpu": "RTX 4060"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Asus', 2500, CURRENT_TIMESTAMP
),
(
    'LEN-LEG-P7I', 'SN-LEN-L001', 'Lenovo Legion Pro 7i', 35000000, 32000000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Lenovo Legion Pro 7i Gen 8 adalah monster gaming yang ditenagai oleh prosesor flagship Intel Core i9-13900HX dan GPU NVIDIA RTX 4080 yang sangat bertenaga. Dirancang untuk para gamer kompetitif dan konten kreator kelas atas, laptop ini menampilkan layar resolusi tinggi dengan akurasi warna luar biasa. Sistem pendingin ColdFront 5.0 menjaga mesin tetap dingin, sementara keyboard Legion TrueStrike memberikan kenyamanan dan presisi tingkat e-sports.', ARRAY['/lenovo-thinkpad-laptop.jpg'], 
    '{"ram": "32GB", "storage": "1TB", "processor": "Intel Core i9-13900HX", "gpu": "RTX 4080"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Lenovo', 2800, CURRENT_TIMESTAMP
),
(
    'HP-OMEN-16', 'SN-HP-L001', 'HP Omen 16', 22000000, 20000000, 
    (SELECT id FROM "brands" WHERE name = 'HP'), 'Laptop', 'HP Omen 16 menghadirkan perpaduan sempurna antara desain minimalis elegan dan tenaga gaming maksimal. Dilengkapi dengan prosesor AMD Ryzen 7 7840HS dan grafis RTX 4060, laptop ini siap menangani segala game terbaru maupun aplikasi editing yang berat. Fitur OMEN Gaming Hub memungkinkan Anda mengontrol penuh performa sistem, mulai dari undervolting hingga pencahayaan RGB per-tombol. Kondisi Second yang masih sangat prima dan siap pakai.', ARRAY['/laptops/HP-OMEN-16.png'], 
    '{"ram": "16GB", "storage": "512GB", "processor": "AMD Ryzen 7 7840HS", "gpu": "RTX 4060"}', (SELECT id FROM "conditions" WHERE name = 'Second'), 'No Warranty', 2350, CURRENT_TIMESTAMP
),
(
    'DELL-XPS-15', 'SN-DELL-L001', 'Dell XPS 15', 30000000, 27500000, 
    (SELECT id FROM "brands" WHERE name = 'Dell'), 'Laptop', 'Dell XPS 15 9530 adalah mahakarya laptop kreator konten premium. Dengan sasis aluminium CNC yang sangat presisi dan sandaran tangan serat karbon, laptop ini tidak hanya ringan tapi juga sangat kokoh. Ditenagai oleh prosesor Intel Core i7-13700H dan kartu grafis RTX 4050, XPS 15 memberikan performa luar biasa untuk mengedit foto, video, dan desain grafis. Layar InfinityEdge bezel-less memberikan pengalaman visual tanpa batas yang imersif.', ARRAY['/hp-pavilion-laptop.jpg'], 
    '{"ram": "16GB", "storage": "1TB", "processor": "Intel Core i7-13700H", "gpu": "RTX 4050"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Dell', 1920, CURRENT_TIMESTAMP
),
(
    'ACER-PRED-NEO16', 'SN-ACER-L001', 'Acer Predator Helios Neo 16', 20000000, 18500000, 
    (SELECT id FROM "brands" WHERE name = 'Acer'), 'Laptop', 'Melangkahlah ke arena dengan Acer Predator Helios Neo 16. Membawa performa mematikan dengan Intel Core i5-13500HX dan grafis NVIDIA GeForce RTX 4050, laptop ini adalah pilihan tepat bagi gamer yang mencari rasio performa dan harga terbaik. Teknologi pendingin AeroBlade 3D Fan Generasi ke-5 memastikan sistem tetap stabil, sementara layar tajamnya menyajikan detail visual yang sangat memanjakan mata.', ARRAY['/acer-swift-laptop.jpg'], 
    '{"ram": "16GB", "storage": "512GB", "processor": "Intel Core i5-13500HX", "gpu": "RTX 4050"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Acer', 2600, CURRENT_TIMESTAMP
),
(
    'LEN-TP-X1C', 'SN-LEN-L002', 'Lenovo ThinkPad X1 Carbon Gen 11', 28000000, 26000000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Legenda laptop bisnis premium kini semakin sempurna. Lenovo ThinkPad X1 Carbon Gen 11 menawarkan portabilitas ultra-ringan tanpa mengorbankan durabilitas khas militer MIL-STD-810H. Ditenagai Intel Core i7-1355U vPro, laptop ini memberikan keamanan tingkat enterprise dan produktivitas tinggi. Keyboard ThinkPad yang ikonik memastikan kenyamanan mengetik berjam-jam. Unit Refurbished ini telah melewati kontrol kualitas ketat untuk memastikan kondisi seperti baru.', ARRAY['/lenovo-thinkpad-laptop.jpg'], 
    '{"ram": "16GB", "storage": "512GB", "processor": "Intel Core i7-1355U", "display": "14-inch WUXGA"}', (SELECT id FROM "conditions" WHERE name = 'Refurbished'), '1 Year Lenovo', 1120, CURRENT_TIMESTAMP
),
(
    'ASUS-VIVO-GO14', 'SN-ASUS-L002', 'Asus Vivobook Go 14', 6000000, 5200000, 
    (SELECT id FROM "brands" WHERE name = 'Asus'), 'Laptop', 'ASUS Vivobook Go 14 E1404FA adalah laptop yang ringan, ringkas, dan sangat pas untuk pelajar maupun pekerja kantoran yang bermobilitas tinggi. Ditenagai oleh prosesor AMD Ryzen 3 7320U yang hemat daya namun responsif, laptop ini mampu menangani tugas sehari-hari seperti browsing, mengetik, dan presentasi dengan sangat lancar. Dilengkapi fitur ErgoSense keyboard dan engsel lay-flat 180 derajat yang mempermudah kolaborasi.', ARRAY['/laptops/ASUS-VIVO-GO14.png'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "AMD Ryzen 3 7320U", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Asus', 1380, CURRENT_TIMESTAMP
),
(
    'LEN-IP-SLIM3', 'SN-LEN-L003', 'Lenovo IdeaPad Slim 3', 7500000, 6800000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Lenovo IdeaPad Slim 3 dirancang untuk mobilitas dan produktivitas harian Anda. Membawa prosesor Intel Core i3-1215U generasi ke-12, laptop ini memberikan performa yang gesit untuk multitasking kasual, hiburan, dan video call. Desainnya yang ramping memudahkan Anda untuk membawanya ke mana saja. Dilengkapi fitur privasi webcam shutter dan layar perlindungan mata untuk kenyamanan pemakaian jangka panjang.', ARRAY['/lenovo-thinkpad-laptop.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "Intel Core i3-1215U", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years Lenovo', 1430, CURRENT_TIMESTAMP
),
(
    'ACER-ASP-5', 'SN-ACER-L002', 'Acer Aspire 5', 8000000, 7100000, 
    (SELECT id FROM "brands" WHERE name = 'Acer'), 'Laptop', 'Acer Aspire 5 A514 adalah solusi serbaguna untuk kebutuhan komputasi harian yang dapat diandalkan. Mengandalkan prosesor Intel Core i5-1135G7, laptop ini memiliki keseimbangan sempurna antara performa tangguh untuk bekerja dan efisiensi baterai yang awet. Desain bodi dengan aksen metal memberikan sentuhan premium, sementara konektivitas yang lengkap memudahkan Anda untuk terhubung ke berbagai perangkat eksternal.', ARRAY['/acer-swift-laptop.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "Intel Core i5-1135G7", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Acer', 1450, CURRENT_TIMESTAMP
),
(
    'HP-14S', 'SN-HP-L002', 'HP 14s', 6500000, 5800000, 
    (SELECT id FROM "brands" WHERE name = 'HP'), 'Laptop', 'Tetap terhubung dan produktif di mana pun Anda berada dengan laptop HP 14s fq1032AU. Hadir dengan desain tipis dan bezel mikro yang membuat layar terasa lebih lega. Ditenagai prosesor AMD Ryzen 3 5300U yang bertenaga untuk kegiatan harian dan baterai yang tahan lama, laptop ini adalah teman sempurna untuk aktivitas belajar, bekerja, hingga menonton film favorit. Bobotnya yang ringan tidak akan membebani tas Anda.', ARRAY['/laptops/HP-14S.png'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "AMD Ryzen 3 5300U", "display": "14-inch HD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '2 Years HP', 1470, CURRENT_TIMESTAMP
),
(
    'DELL-INSP-15', 'SN-DELL-L002', 'Dell Inspiron 15 3520', 9500000, 8500000, 
    (SELECT id FROM "brands" WHERE name = 'Dell'), 'Laptop', 'Selesaikan lebih banyak pekerjaan dengan Dell Inspiron 15 3520. Menawarkan layar 15.6 inci FHD yang luas dengan refresh rate 120Hz yang mulus, laptop ini memberikan kenyamanan visual lebih baik saat menggulir dokumen maupun menonton video. Diperkuat oleh prosesor Intel Core i5-1235U, Inspiron 15 memberikan tenaga multitasking yang mulus, ditambah dengan ukuran keyboard penuh lengkap dengan numpad untuk input data yang cepat.', ARRAY['/hp-pavilion-laptop.jpg'], 
    '{"ram": "8GB", "storage": "512GB", "processor": "Intel Core i5-1235U", "display": "15.6-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'New'), '1 Year Dell', 1650, CURRENT_TIMESTAMP
),
(
    'LEN-TP-T480', 'SN-LEN-L004', 'Lenovo ThinkPad T480 (Second)', 4500000, 3500000, 
    (SELECT id FROM "brands" WHERE name = 'Lenovo'), 'Laptop', 'Kuda beban legendaris dari Lenovo, ThinkPad T480 menawarkan durabilitas tiada tanding dan fleksibilitas tinggi. Sangat populer di kalangan profesional karena kemudahan upgrade dan fitur dual-battery yang revolusioner. Ditenagai Intel Core i5-8350U, laptop Second ini masih sangat relevan dan tangguh untuk menangani beban kerja kantoran, pemrograman, dan administrasi database. Pilihan paling cerdas untuk performa handal dengan budget terjangkau.', ARRAY['/lenovo-thinkpad-laptop.jpg'], 
    '{"ram": "8GB", "storage": "256GB", "processor": "Intel Core i5-8350U", "display": "14-inch FHD"}', (SELECT id FROM "conditions" WHERE name = 'Second'), '1 Month Store', 1600, CURRENT_TIMESTAMP
)
ON CONFLICT ("sku") DO NOTHING;

-- 6. Insert Initial Stock for Products into monitor_stock
INSERT INTO "monitor_stock" ("product_id", "current_stock")
SELECT id, 15 FROM "products";
