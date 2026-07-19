-- =====================================================================
-- EMOBO E-COMMERCE - DUMMY DATA
--
-- Isi: 6 brand, 3 kondisi, 30 laptop, 12 customer, 6 transaksi barang
-- masuk, 93 order (Jan 2025 - Jul 2026), pembayaran, review, dan stok.
--
-- Catatan penting:
--   * "specifications" disimpan sebagai STRING HTML (bukan objek JSON),
--     supaya langsung tampil rapi di rich text editor TipTap admin dan
--     di halaman detail produk. Kolomnya tetap jsonb, jadi dibungkus
--     to_jsonb(...::text).
--   * Nomor order mengikuti format aplikasi: TR<DDMMYYYY>-<NNNN>
--     (lihat order.service.ts).
--   * File nota barang masuk yang ditunjuk "receipt_url" dibuat oleh
--     scripts/generate-invoices.ts -- jalankan setelah file ini.
--
-- Cara pakai:
--   1. psql -d <database> -f dummy_data.sql
--      (atau: npx prisma db execute --file dummy_data.sql --schema prisma/schema.prisma)
--   2. npx tsx scripts/generate-invoices.ts   <- membuat file PDF nota & invoice
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Pastikan kolom UUID punya DEFAULT.
--
-- db_schema.sql mendeklarasikan DEFAULT gen_random_uuid() pada tiap primary
-- key, tapi kalau skema dibuat lewat `prisma migrate` defaultnya tidak ikut
-- terpasang (Prisma mengisi UUID dari sisi aplikasi). Seed ini SQL murni,
-- jadi tanpa default semua INSERT gagal dengan "brand_id null".
-- Aman dijalankan berulang dan tidak mengubah data yang sudah ada.
-- ---------------------------------------------------------------------
ALTER TABLE "brands"               ALTER COLUMN "brand_id"               SET DEFAULT gen_random_uuid();
ALTER TABLE "conditions"           ALTER COLUMN "condition_id"           SET DEFAULT gen_random_uuid();
ALTER TABLE "products"             ALTER COLUMN "product_id"             SET DEFAULT gen_random_uuid();
ALTER TABLE "profiles"             ALTER COLUMN "profile_id"             SET DEFAULT gen_random_uuid();
ALTER TABLE "users"                ALTER COLUMN "user_id"                SET DEFAULT gen_random_uuid();
ALTER TABLE "registers"            ALTER COLUMN "register_id"            SET DEFAULT gen_random_uuid();
ALTER TABLE "monitor_stock"        ALTER COLUMN "monitor_stock_id"       SET DEFAULT gen_random_uuid();
ALTER TABLE "order_item"           ALTER COLUMN "order_item_id"          SET DEFAULT gen_random_uuid();
ALTER TABLE "payments"             ALTER COLUMN "payment_id"             SET DEFAULT gen_random_uuid();
ALTER TABLE "reviews"              ALTER COLUMN "review_id"              SET DEFAULT gen_random_uuid();
ALTER TABLE "inbound_transactions" ALTER COLUMN "inbound_transaction_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "inbound_items"        ALTER COLUMN "inbound_item_id"        SET DEFAULT gen_random_uuid();

-- ---------------------------------------------------------------------
-- 1. Bersihkan data lama. Admin (users/profiles) sengaja tidak di-TRUNCATE.
-- ---------------------------------------------------------------------
TRUNCATE TABLE "reviews", "payments", "order_item", "orders",
               "inbound_items", "inbound_transactions",
               "monitor_stock", "products", "brands", "conditions" CASCADE;

DELETE FROM "users" WHERE "role" = 'CUSTOMER';
DELETE FROM "profiles" p
 WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."profile_id" = p."profile_id");

-- ---------------------------------------------------------------------
-- 2. Brand & kondisi
-- ---------------------------------------------------------------------
INSERT INTO "brands" ("name", "updated_at") VALUES
('Apple', CURRENT_TIMESTAMP),
('Asus', CURRENT_TIMESTAMP),
('Lenovo', CURRENT_TIMESTAMP),
('HP', CURRENT_TIMESTAMP),
('Dell', CURRENT_TIMESTAMP),
('Acer', CURRENT_TIMESTAMP);

INSERT INTO "conditions" ("name", "updated_at") VALUES
('New', CURRENT_TIMESTAMP),
('Second', CURRENT_TIMESTAMP),
('Refurbished', CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------
-- 3. Produk (30 laptop)
-- ---------------------------------------------------------------------
INSERT INTO "products" (
    "sku", "serial_number", "name", "price", "buy_price", "brand_id",
    "description", "images", "specifications", "condition_id", "warranty", "weight",
    "created_at", "updated_at"
) VALUES

-- ============================== APPLE ==============================
(
 'APL-MBA-M2-8256', 'SN-APLMBA-0001', 'MacBook Air M2 13 inci', 14500000, 12900000,
 (SELECT brand_id FROM brands WHERE name='Apple'),
 'MacBook Air M2 menggabungkan bodi setipis 1,13 cm dengan performa chip Apple M2 yang senyap tanpa kipas. Layar Liquid Retina 13,6 inci menampilkan warna yang akurat untuk kerja desain maupun menonton, sementara baterainya sanggup menemani seharian penuh. Pilihan paling seimbang antara bobot, daya tahan, dan tenaga.',
 '["/laptops/APL-MBA-M2-8256.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Apple M2 (8-core CPU, 4 performance + 4 efficiency)</li><li><strong>Grafis:</strong> Apple M2 8-core GPU terintegrasi</li><li><strong>Neural Engine:</strong> 16-core</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB unified memory (onboard, tidak dapat di-upgrade)</li><li><strong>Penyimpanan:</strong> SSD 256 GB PCIe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 13,6 inci Liquid Retina</li><li><strong>Resolusi:</strong> 2560 x 1664 piksel</li><li><strong>Kecerahan:</strong> 500 nits, gamut warna P3</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt / USB 4</li><li>MagSafe 3 untuk pengisian daya</li><li>Jack audio 3,5 mm</li><li>Wi-Fi 6 (802.11ax), Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 52,6 Wh, hingga 18 jam pemutaran video</li><li><strong>Berat:</strong> 1,24 kg</li><li><strong>Sistem Operasi:</strong> macOS</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi iBox', 1240, TIMESTAMP '2024-12-20 09:00:00', CURRENT_TIMESTAMP
),
(
 'APL-MBA-M2-8256-S', 'SN-APLMBA-0002', 'MacBook Air M2 13 inci (Second)', 10900000, 9200000,
 (SELECT brand_id FROM brands WHERE name='Apple'),
 'Unit MacBook Air M2 bekas pakai pribadi dengan kondisi fisik mulus, minim baret halus di bagian bawah. Semua fungsi sudah dites normal: keyboard, trackpad, speaker, kamera, dan seluruh port. Cocok bagi yang ingin merasakan chip M2 dengan harga jauh lebih bersahabat.',
 '["/laptops/APL-MBA-M2-8256.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Apple M2 (8-core CPU)</li><li><strong>Grafis:</strong> Apple M2 8-core GPU terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB unified memory</li><li><strong>Penyimpanan:</strong> SSD 256 GB PCIe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 13,6 inci Liquid Retina</li><li><strong>Resolusi:</strong> 2560 x 1664 piksel, 500 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt / USB 4, MagSafe 3, jack audio 3,5 mm</li><li>Wi-Fi 6, Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 52,6 Wh</li><li><strong>Berat:</strong> 1,24 kg</li><li><strong>Sistem Operasi:</strong> macOS</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; mulus, baret halus wajar pemakaian</li><li><strong>Cycle count baterai:</strong> 187 kali, kesehatan 91%</li><li><strong>Kelengkapan:</strong> unit, charger original, dus</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1240, TIMESTAMP '2024-12-20 09:05:00', CURRENT_TIMESTAMP
),
(
 'APL-MBP-M3M-361T', 'SN-APLMBP-0001', 'MacBook Pro M3 Max 16 inci', 55000000, 50000000,
 (SELECT brand_id FROM brands WHERE name='Apple'),
 'MacBook Pro 16 inci dengan chip M3 Max adalah mesin kerja untuk profesional yang tidak mau kompromi. Rendering video 8K, kompilasi proyek besar, dan simulasi 3D berjalan tanpa hambatan berkat 16-core CPU dan 40-core GPU. Layar Liquid Retina XDR mini-LED memberi rentang dinamis ekstrem dengan ProMotion 120Hz.',
 '["/laptops/APL-MBP-M3M-361T.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Apple M3 Max (16-core CPU: 12 performance + 4 efficiency)</li><li><strong>Grafis:</strong> 40-core GPU dengan hardware ray tracing</li><li><strong>Neural Engine:</strong> 16-core</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 36 GB unified memory, bandwidth 400 GB/s</li><li><strong>Penyimpanan:</strong> SSD 1 TB PCIe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 16,2 inci Liquid Retina XDR (mini-LED)</li><li><strong>Resolusi:</strong> 3456 x 2234 piksel</li><li><strong>Refresh Rate:</strong> ProMotion adaptif hingga 120 Hz</li><li><strong>Kecerahan:</strong> 1000 nits sustained, 1600 nits puncak HDR</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>3x Thunderbolt 4</li><li>HDMI 2.1, slot kartu SDXC</li><li>MagSafe 3, jack audio 3,5 mm</li><li>Wi-Fi 6E, Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 100 Wh, adaptor 140W USB-C</li><li><strong>Berat:</strong> 2,14 kg</li><li><strong>Sistem Operasi:</strong> macOS</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi iBox', 2140, TIMESTAMP '2024-12-20 09:10:00', CURRENT_TIMESTAMP
),
(
 'APL-MBP-M3M-361T-R', 'SN-APLMBP-0002', 'MacBook Pro M3 Max 16 inci (Refurbished)', 44500000, 39000000,
 (SELECT brand_id FROM brands WHERE name='Apple'),
 'Unit refurbished MacBook Pro M3 Max yang telah melewati pemeriksaan menyeluruh: pembersihan internal, penggantian thermal paste, dan uji beban penuh selama 8 jam. Kondisi kosmetik hampir seperti baru dan seluruh fungsi berjalan normal. Pilihan cerdas untuk mendapat performa kelas studio dengan selisih harga belasan juta.',
 '["/laptops/APL-MBP-M3M-361T.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Apple M3 Max (16-core CPU)</li><li><strong>Grafis:</strong> 40-core GPU</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 36 GB unified memory</li><li><strong>Penyimpanan:</strong> SSD 1 TB PCIe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 16,2 inci Liquid Retina XDR</li><li><strong>Resolusi:</strong> 3456 x 2234 piksel, ProMotion 120 Hz</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>3x Thunderbolt 4, HDMI 2.1, SDXC, MagSafe 3</li><li>Wi-Fi 6E, Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 100 Wh</li><li><strong>Berat:</strong> 2,14 kg</li><li><strong>Sistem Operasi:</strong> macOS</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A+ &ndash; nyaris tanpa cacat kosmetik</li><li><strong>Kesehatan baterai:</strong> 96%, 62 cycle</li><li><strong>Sudah dilakukan:</strong> ganti thermal paste, uji stress 8 jam, kalibrasi baterai</li><li><strong>Kelengkapan:</strong> unit, adaptor 140W, kabel USB-C</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Refurbished'), '6 Bulan Garansi Toko', 2140, TIMESTAMP '2024-12-20 09:15:00', CURRENT_TIMESTAMP
),

-- ============================== ASUS ==============================
(
 'ASUS-ROG-G16', 'SN-ASUSROG-0001', 'Asus ROG Strix G16 G614', 25000000, 22500000,
 (SELECT brand_id FROM brands WHERE name='Asus'),
 'ROG Strix G16 dibangun untuk gamer yang mengejar frame rate tinggi. Kombinasi Core i7-13650HX 14 inti dan RTX 4060 dengan TGP 140W melibas game AAA di resolusi FHD+ dengan mulus. Layar 165Hz dan sistem pendingin ROG Intelligent Cooling berlapis liquid metal menjaga performa tetap stabil selama sesi panjang.',
 '["/laptops/ASUS-ROG-G16.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i7-13650HX (14 core / 20 thread, hingga 4,9 GHz)</li><li><strong>Grafis:</strong> NVIDIA GeForce RTX 4060 8 GB GDDR6, TGP 140W</li><li><strong>Pendingin:</strong> ROG Intelligent Cooling, liquid metal pada CPU</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB DDR5-4800 (2 slot SO-DIMM, maks 32 GB)</li><li><strong>Penyimpanan:</strong> SSD 1 TB PCIe 4.0 NVMe (1 slot M.2 kosong)</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 16 inci IPS anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1200 piksel (FHD+, 16:10)</li><li><strong>Refresh Rate:</strong> 165 Hz, response 3 ms, 100% sRGB</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x Thunderbolt 4 (DisplayPort + Power Delivery)</li><li>3x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.1, RJ45 LAN, jack combo audio</li><li>Wi-Fi 6E, Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 90 Wh, adaptor 240W</li><li><strong>Berat:</strong> 2,5 kg</li><li><strong>Keyboard:</strong> RGB per-key, N-key rollover</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Asus', 2500, TIMESTAMP '2024-12-20 09:20:00', CURRENT_TIMESTAMP
),
(
 'ASUS-ROG-G16-S', 'SN-ASUSROG-0002', 'Asus ROG Strix G16 G614 (Second)', 18900000, 16500000,
 (SELECT brand_id FROM brands WHERE name='Asus'),
 'ROG Strix G16 bekas pakai kurang dari setahun, dipakai untuk gaming ringan dan editing. Sudah dibersihkan dan diganti thermal paste, suhu idle berada di kisaran 40 derajat. Fisik mulus dengan pemakaian normal, RGB keyboard menyala sempurna di seluruh tombol.',
 '["/laptops/ASUS-ROG-G16.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i7-13650HX (14 core / 20 thread)</li><li><strong>Grafis:</strong> NVIDIA GeForce RTX 4060 8 GB GDDR6</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB DDR5-4800</li><li><strong>Penyimpanan:</strong> SSD 1 TB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 16 inci IPS, 1920 x 1200</li><li><strong>Refresh Rate:</strong> 165 Hz</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>Thunderbolt 4, 3x USB Type-A, HDMI 2.1, RJ45</li><li>Wi-Fi 6E, Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 90 Wh</li><li><strong>Berat:</strong> 2,5 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; fisik mulus, tanpa penyok</li><li><strong>Usia pakai:</strong> 11 bulan</li><li><strong>Sudah dilakukan:</strong> ganti thermal paste, bersih kipas</li><li><strong>Kelengkapan:</strong> unit, adaptor 240W, tas ROG</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 2500, TIMESTAMP '2024-12-20 09:25:00', CURRENT_TIMESTAMP
),
(
 'ASUS-TUF-F15', 'SN-ASUSTUF-0001', 'Asus TUF Gaming F15 FX506HF', 12500000, 11200000,
 (SELECT brand_id FROM brands WHERE name='Asus'),
 'TUF Gaming F15 adalah pintu masuk paling masuk akal ke dunia gaming PC. Core i5-11400H enam inti berpasangan dengan RTX 2050 sanggup menjalankan game esports di 100+ fps dan game AAA di setelan medium. Sasisnya lolos uji ketahanan militer MIL-STD-810H, jadi tahan dibawa mondar-mandir.',
 '["/laptops/ASUS-TUF-F15.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-11400H (6 core / 12 thread, hingga 4,5 GHz)</li><li><strong>Grafis:</strong> NVIDIA GeForce RTX 2050 4 GB GDDR6</li><li><strong>Pendingin:</strong> 2 kipas, 3 heatsink, self-cleaning thermal module</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200 (2 slot SO-DIMM, maks 32 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci IPS anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Refresh Rate:</strong> 144 Hz, Adaptive-Sync</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB 3.2 Gen 2 Type-C (DisplayPort + Power Delivery)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.0b, RJ45 LAN, jack combo audio</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 48 Wh, adaptor 150W</li><li><strong>Berat:</strong> 2,3 kg</li><li><strong>Ketahanan:</strong> sertifikasi militer MIL-STD-810H</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Asus', 2300, TIMESTAMP '2024-12-20 09:30:00', CURRENT_TIMESTAMP
),
(
 'ASUS-ZEN-14-OLED', 'SN-ASUSZEN-0001', 'Asus Zenbook 14 OLED UX3402ZA', 15900000, 14300000,
 (SELECT brand_id FROM brands WHERE name='Asus'),
 'Zenbook 14 OLED menyajikan panel 2.8K OLED bersertifikat PANTONE Validated dan VESA DisplayHDR True Black 600, warnanya tajam dan hitamnya benar-benar pekat. Bodi aluminium seberat 1,39 kg dengan prosesor Core i5-1240P membuatnya sangat nyaman dibawa rapat, kuliah, atau kerja di kafe.',
 '["/laptops/ASUS-ZEN-14-OLED.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1240P (12 core / 16 thread, hingga 4,4 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB LPDDR5-5200 (onboard)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci OLED, rasio 16:10</li><li><strong>Resolusi:</strong> 2880 x 1800 piksel (2.8K)</li><li><strong>Refresh Rate:</strong> 90 Hz</li><li><strong>Warna:</strong> 100% DCI-P3, PANTONE Validated, DisplayHDR True Black 600</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4 (DisplayPort + Power Delivery)</li><li>1x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.0, slot microSD, jack combo audio</li><li>Wi-Fi 6E, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 75 Wh, fast charging 60% dalam 49 menit</li><li><strong>Berat:</strong> 1,39 kg</li><li><strong>Bodi:</strong> aluminium, sertifikasi MIL-STD-810H</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Asus', 1390, TIMESTAMP '2024-12-20 09:35:00', CURRENT_TIMESTAMP
),
(
 'ASUS-VIVO-GO14', 'SN-ASUSVIVO-0001', 'Asus Vivobook Go 14 E1404FA', 6000000, 5200000,
 (SELECT brand_id FROM brands WHERE name='Asus'),
 'Vivobook Go 14 dirancang untuk pelajar dan pekerja yang butuh laptop ringan tanpa menguras dompet. Ryzen 3 7320U hemat daya cukup gesit untuk browsing, mengetik, presentasi, dan video call. Engsel lay-flat 180 derajat memudahkan berbagi layar saat diskusi kelompok.',
 '["/laptops/ASUS-VIVO-GO14.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> AMD Ryzen 3 7320U (4 core / 8 thread, hingga 4,1 GHz)</li><li><strong>Grafis:</strong> AMD Radeon 610M terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB LPDDR5-5500 (onboard, tidak dapat di-upgrade)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Kecerahan:</strong> 250 nits, rasio layar-ke-bodi 82%</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB 3.2 Gen 1 Type-C</li><li>2x USB 2.0 Type-A</li><li>HDMI 1.4, jack combo audio</li><li>Wi-Fi 6, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 42 Wh, adaptor 45W</li><li><strong>Berat:</strong> 1,38 kg</li><li><strong>Keyboard:</strong> ErgoSense, engsel lay-flat 180 derajat</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Asus', 1380, TIMESTAMP '2024-12-20 09:40:00', CURRENT_TIMESTAMP
),
(
 'ASUS-VIVO-GO14-S', 'SN-ASUSVIVO-0002', 'Asus Vivobook Go 14 E1404FA (Second)', 4200000, 3400000,
 (SELECT brand_id FROM brands WHERE name='Asus'),
 'Vivobook Go 14 bekas milik mahasiswa, pemakaian ringan untuk kuliah daring. Layar bersih tanpa dead pixel, engsel masih rapat, dan baterai masih sanggup 5-6 jam pemakaian ringan. Pilihan hemat untuk laptop pertama atau cadangan.',
 '["/laptops/ASUS-VIVO-GO14.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> AMD Ryzen 3 7320U (4 core / 8 thread)</li><li><strong>Grafis:</strong> AMD Radeon 610M terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB LPDDR5 onboard</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS, 1920 x 1080</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>USB Type-C, 2x USB Type-A, HDMI 1.4</li><li>Wi-Fi 6, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 42 Wh</li><li><strong>Berat:</strong> 1,38 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> B+ &ndash; baret halus di penutup layar</li><li><strong>Usia pakai:</strong> 1 tahun 4 bulan</li><li><strong>Daya tahan baterai:</strong> sekitar 5-6 jam pemakaian ringan</li><li><strong>Kelengkapan:</strong> unit dan charger original, tanpa dus</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1380, TIMESTAMP '2024-12-20 09:45:00', CURRENT_TIMESTAMP
),

-- ============================== LENOVO ==============================
(
 'LEN-LEG-P7I', 'SN-LENLEG-0001', 'Lenovo Legion Pro 7i Gen 8', 35000000, 31500000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'Legion Pro 7i Gen 8 berada di puncak lini gaming Lenovo. Core i9-13900HX 24 inti dipadu RTX 4080 dengan TGP 175W sanggup menembus 240 fps di panel WQXGA bawaannya. Sistem ColdFront 5.0 dengan kipas 4D dan chip AI LA1 mengatur daya secara real time supaya performa tidak turun saat panas.',
 '["/laptops/LEN-LEG-P7I.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i9-13900HX (24 core / 32 thread, hingga 5,4 GHz)</li><li><strong>Grafis:</strong> NVIDIA GeForce RTX 4080 12 GB GDDR6, TGP 175W</li><li><strong>Pendingin:</strong> Lenovo ColdFront 5.0, kipas 4D, chip AI Legion LA1</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 32 GB DDR5-5600 (2 slot SO-DIMM, maks 64 GB)</li><li><strong>Penyimpanan:</strong> SSD 1 TB PCIe 4.0 NVMe (1 slot M.2 kosong)</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 16 inci IPS, rasio 16:10</li><li><strong>Resolusi:</strong> 2560 x 1600 piksel (WQXGA)</li><li><strong>Refresh Rate:</strong> 240 Hz, response 3 ms</li><li><strong>Warna:</strong> 100% sRGB, 500 nits, G-SYNC</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x Thunderbolt 4, 1x USB-C 3.2 Gen 2</li><li>3x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.1, RJ45 LAN, jack combo audio</li><li>Wi-Fi 6E, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 99,99 Wh, adaptor 330W</li><li><strong>Berat:</strong> 2,8 kg</li><li><strong>Keyboard:</strong> Legion TrueStrike, RGB per-key</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi Lenovo', 2800, TIMESTAMP '2024-12-20 09:50:00', CURRENT_TIMESTAMP
),
(
 'LEN-IP-SLIM3', 'SN-LENIP-0001', 'Lenovo IdeaPad Slim 3 14', 7500000, 6700000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'IdeaPad Slim 3 adalah laptop harian yang tidak neko-neko namun mengerjakan tugasnya dengan baik. Core i3-1215U enam inti cukup lincah untuk multitasking dokumen, spreadsheet, dan puluhan tab browser. Dilengkapi penutup fisik webcam dan mode perlindungan mata untuk pemakaian panjang.',
 '["/laptops/LEN-IP-SLIM3.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i3-1215U (6 core / 8 thread, hingga 4,4 GHz)</li><li><strong>Grafis:</strong> Intel UHD Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB LPDDR5-4800 (onboard)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Kecerahan:</strong> 300 nits, TUV Low Blue Light</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 1 (DisplayPort + Power Delivery)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 1.4b, slot microSD, jack combo audio</li><li>Wi-Fi 6, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 47 Wh, Rapid Charge Express</li><li><strong>Berat:</strong> 1,43 kg</li><li><strong>Privasi:</strong> penutup fisik webcam</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Lenovo', 1430, TIMESTAMP '2024-12-20 09:55:00', CURRENT_TIMESTAMP
),
(
 'LEN-IP-SLIM3-S', 'SN-LENIP-0002', 'Lenovo IdeaPad Slim 3 14 (Second)', 5100000, 4200000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'IdeaPad Slim 3 bekas kantor, dipakai untuk administrasi dan sudah di-reset ke Windows bersih. Kondisi fisik rapi, keyboard masih empuk, dan seluruh port berfungsi. Cocok untuk kebutuhan mengetik dan browsing sehari-hari dengan anggaran terbatas.',
 '["/laptops/LEN-IP-SLIM3.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i3-1215U (6 core / 8 thread)</li><li><strong>Grafis:</strong> Intel UHD Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB LPDDR5 onboard</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS, 1920 x 1080, 300 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>USB-C, 2x USB Type-A, HDMI 1.4b, microSD</li><li>Wi-Fi 6, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 47 Wh</li><li><strong>Berat:</strong> 1,43 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> B+ &ndash; eks pemakaian kantor, fisik rapi</li><li><strong>Usia pakai:</strong> 1 tahun 8 bulan</li><li><strong>Sudah dilakukan:</strong> instal ulang Windows, bersih menyeluruh</li><li><strong>Kelengkapan:</strong> unit dan charger original</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1430, TIMESTAMP '2024-12-20 10:00:00', CURRENT_TIMESTAMP
),
(
 'LEN-TP-X1C', 'SN-LENX1C-0001', 'Lenovo ThinkPad X1 Carbon Gen 11', 28000000, 25200000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'ThinkPad X1 Carbon Gen 11 adalah standar emas laptop bisnis premium. Bobot 1,12 kg berkat sasis serat karbon, namun tetap lolos 12 uji ketahanan militer. Core i7-1355U dengan vPro membawa fitur keamanan dan manajemen tingkat perusahaan, sementara keyboard ThinkPad legendaris membuat mengetik berjam-jam terasa ringan.',
 '["/laptops/LEN-TP-X1C.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i7-1355U vPro (10 core / 12 thread, hingga 5,0 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB LPDDR5-6400 (onboard)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe, terenkripsi</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS anti-glare, rasio 16:10</li><li><strong>Resolusi:</strong> 1920 x 1200 piksel (WUXGA)</li><li><strong>Kecerahan:</strong> 400 nits, 100% sRGB</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.0b, jack combo audio</li><li>Wi-Fi 6E, Bluetooth 5.1</li></ul><h2>Keamanan</h2><ul><li>Pemindai sidik jari terintegrasi tombol daya</li><li>ThinkShutter penutup kamera, IR camera untuk Windows Hello</li><li>Chip keamanan dTPM 2.0</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 57 Wh, Rapid Charge 80% dalam 60 menit</li><li><strong>Berat:</strong> 1,12 kg</li><li><strong>Ketahanan:</strong> MIL-STD-810H, 12 metode uji</li><li><strong>Sistem Operasi:</strong> Windows 11 Pro</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '3 Tahun Resmi Lenovo', 1120, TIMESTAMP '2024-12-20 10:05:00', CURRENT_TIMESTAMP
),
(
 'LEN-TP-X1C-R', 'SN-LENX1C-0002', 'Lenovo ThinkPad X1 Carbon Gen 11 (Refurbished)', 16500000, 14000000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'Unit refurbished eks korporat yang sudah melewati kontrol kualitas ketat: pembersihan menyeluruh, penggantian keyboard, dan instalasi ulang Windows 11 Pro berlisensi. Kondisi fisik hampir seperti baru dan baterainya masih di atas 90%. Cara paling terjangkau untuk memiliki ThinkPad kelas atas.',
 '["/laptops/LEN-TP-X1C.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i7-1355U vPro (10 core / 12 thread)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB LPDDR5 onboard</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS, 1920 x 1200, 400 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4, 2x USB Type-A, HDMI 2.0b</li><li>Wi-Fi 6E, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 57 Wh</li><li><strong>Berat:</strong> 1,12 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Pro (lisensi digital)</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; eks korporat, fisik nyaris mulus</li><li><strong>Kesehatan baterai:</strong> 92%</li><li><strong>Sudah dilakukan:</strong> ganti keyboard, instal ulang Windows, uji fungsi penuh</li><li><strong>Kelengkapan:</strong> unit dan adaptor USB-C 65W</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Refurbished'), '6 Bulan Garansi Toko', 1120, TIMESTAMP '2024-12-20 10:10:00', CURRENT_TIMESTAMP
),
(
 'LEN-TP-T480', 'SN-LENT480-0001', 'Lenovo ThinkPad T480 (Second)', 4500000, 3500000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'ThinkPad T480 adalah kuda beban legendaris yang masih dicari sampai sekarang. Daya tariknya ada pada sistem dua baterai yang bisa diganti tanpa mematikan laptop, dan kemudahan upgrade RAM sampai 32 GB. Untuk mengetik, pemrograman, dan kerja kantoran, unit ini masih lebih dari cukup.',
 '["/laptops/LEN-TP-T480.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-8350U (4 core / 8 thread, hingga 3,6 GHz)</li><li><strong>Grafis:</strong> Intel UHD Graphics 620</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-2400 (2 slot SO-DIMM, dapat di-upgrade hingga 32 GB)</li><li><strong>Penyimpanan:</strong> SSD 256 GB M.2 NVMe (slot 2,5 inci tersedia)</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x Thunderbolt 3 / USB-C</li><li>3x USB 3.1 Type-A</li><li>HDMI, RJ45 LAN, slot SD, jack combo audio</li><li>Wi-Fi 5, Bluetooth 4.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> sistem ganda 24 Wh internal + 24 Wh eksternal (hot-swap)</li><li><strong>Berat:</strong> 1,6 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Pro</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> B &ndash; ada baret pemakaian di penutup layar dan sandaran tangan</li><li><strong>Baterai:</strong> keduanya masih tahan sekitar 4 jam gabungan</li><li><strong>Sudah dilakukan:</strong> ganti thermal paste, instal ulang Windows</li><li><strong>Kelengkapan:</strong> unit dan charger (bukan original)</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1600, TIMESTAMP '2024-12-20 10:15:00', CURRENT_TIMESTAMP
),
(
 'LEN-YOGA-7I', 'SN-LENYOGA-0001', 'Lenovo Yoga 7i 14 Gen 8', 14900000, 13400000,
 (SELECT brand_id FROM brands WHERE name='Lenovo'),
 'Yoga 7i adalah laptop konvertibel dengan engsel 360 derajat, bisa dipakai sebagai laptop, tenda, atau tablet. Layar sentuh WUXGA 400 nits mendukung stylus, cocok untuk mencatat dan sketsa. Core i5-1335U 10 inti dan RAM 16 GB membuatnya nyaman untuk multitasking berat sekalipun.',
 '["/laptops/LEN-YOGA-7I.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1335U (10 core / 12 thread, hingga 4,6 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB LPDDR5-5200 (onboard)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS layar sentuh, rasio 16:10</li><li><strong>Resolusi:</strong> 1920 x 1200 piksel (WUXGA)</li><li><strong>Kecerahan:</strong> 400 nits, 100% sRGB</li><li><strong>Stylus:</strong> mendukung Lenovo Digital Pen</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4</li><li>1x USB 3.2 Gen 1 Type-A</li><li>HDMI 1.4b, slot microSD, jack combo audio</li><li>Wi-Fi 6E, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 71 Wh, Rapid Charge</li><li><strong>Berat:</strong> 1,43 kg</li><li><strong>Engsel:</strong> 360 derajat, mode laptop / tenda / tablet</li><li><strong>Audio:</strong> 4 speaker Dolby Atmos</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Lenovo', 1430, TIMESTAMP '2024-12-20 10:20:00', CURRENT_TIMESTAMP
),

-- ============================== HP ==============================
(
 'HP-VICT-15', 'SN-HPVICT-0001', 'HP Victus 15 fb0028', 9900000, 8900000,
 (SELECT brand_id FROM brands WHERE name='HP'),
 'Victus 15 membuktikan laptop gaming tidak harus mahal dan norak. Desainnya kalem sehingga tetap pantas dibawa ke kantor, namun Ryzen 5 5600H dan GTX 1650 di dalamnya siap menangani Valorant, Dota 2, dan GTA V dengan nyaman. Layar 144Hz membuat gerakan terasa jauh lebih halus.',
 '["/laptops/HP-VICT-15.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> AMD Ryzen 5 5600H (6 core / 12 thread, hingga 4,2 GHz)</li><li><strong>Grafis:</strong> NVIDIA GeForce GTX 1650 4 GB GDDR6</li><li><strong>Pendingin:</strong> 2 kipas, 3 heat pipe, ventilasi belakang lebar</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200 (2 slot SO-DIMM, maks 32 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci IPS anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Refresh Rate:</strong> 144 Hz, 250 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 1 (DisplayPort + Power Delivery)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.1, RJ45 LAN, jack combo audio</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 52,5 Wh, adaptor 150W</li><li><strong>Berat:</strong> 2,29 kg</li><li><strong>Keyboard:</strong> backlit, numpad penuh</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi HP', 2290, TIMESTAMP '2024-12-20 10:25:00', CURRENT_TIMESTAMP
),
(
 'HP-PAV-14', 'SN-HPPAV-0001', 'HP Pavilion 14-dv', 9800000, 8800000,
 (SELECT brand_id FROM brands WHERE name='HP'),
 'Pavilion 14 menyeimbangkan tampilan elegan dengan tenaga yang memadai. Core i5-1235U sepuluh inti menangani pekerjaan kantor, kelas daring, dan editing foto ringan tanpa tersendat. Bodi aluminium tipis 1,41 kg membuatnya gampang diselipkan ke dalam tas.',
 '["/laptops/HP-PAV-14.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1235U (10 core / 12 thread, hingga 4,4 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200 (1 slot SO-DIMM, maks 16 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS micro-edge</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Kecerahan:</strong> 250 nits, 45% NTSC</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 1 (DisplayPort + Power Delivery)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.1, jack combo audio</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 43 Wh, fast charge 50% dalam 45 menit</li><li><strong>Berat:</strong> 1,41 kg</li><li><strong>Audio:</strong> speaker B&amp;O, HP Audio Boost</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi HP', 1410, TIMESTAMP '2024-12-20 10:30:00', CURRENT_TIMESTAMP
),
(
 'HP-PAV-14-S', 'SN-HPPAV-0002', 'HP Pavilion 14-dv (Second)', 6300000, 5200000,
 (SELECT brand_id FROM brands WHERE name='HP'),
 'Pavilion 14 bekas dengan kondisi sangat terawat, bekas pemakaian work from home. Sudah diupgrade RAM menjadi 16 GB sehingga terasa jauh lebih lega untuk multitasking. Baterai masih sehat dan bodinya bebas dari penyok.',
 '["/laptops/HP-PAV-14.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1235U (10 core / 12 thread)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB DDR4-3200 (sudah di-upgrade dari 8 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci IPS, 1920 x 1080</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>USB-C, 2x USB Type-A, HDMI 2.1</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 43 Wh</li><li><strong>Berat:</strong> 1,41 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; sangat terawat, tanpa penyok</li><li><strong>Usia pakai:</strong> 1 tahun 2 bulan</li><li><strong>Kesehatan baterai:</strong> 89%</li><li><strong>Bonus:</strong> RAM sudah di-upgrade ke 16 GB</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1410, TIMESTAMP '2024-12-20 10:35:00', CURRENT_TIMESTAMP
),
(
 'HP-14S', 'SN-HP14S-0001', 'HP 14s fq1032AU', 6500000, 5800000,
 (SELECT brand_id FROM brands WHERE name='HP'),
 'HP 14s adalah teman belajar dan bekerja yang ringkas dan terjangkau. Ryzen 3 5300U empat inti sudah cukup responsif untuk mengetik, browsing, dan menonton film. Bobotnya hanya 1,46 kg dengan bezel tipis, sehingga layar 14 inci terasa lebih lapang dari ukurannya.',
 '["/laptops/HP-14S.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> AMD Ryzen 3 5300U (4 core / 8 thread, hingga 3,8 GHz)</li><li><strong>Grafis:</strong> AMD Radeon Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200 (1 slot SO-DIMM, maks 16 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci micro-edge anti-glare</li><li><strong>Resolusi:</strong> 1366 x 768 piksel (HD)</li><li><strong>Kecerahan:</strong> 250 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 1</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 1.4b, slot SD, jack combo audio</li><li>Wi-Fi 5, Bluetooth 4.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 41 Wh, fast charge 50% dalam 45 menit</li><li><strong>Berat:</strong> 1,46 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi HP', 1460, TIMESTAMP '2024-12-20 10:40:00', CURRENT_TIMESTAMP
),
(
 'HP-14S-R', 'SN-HP14S-0002', 'HP 14s fq1032AU (Refurbished)', 4900000, 4000000,
 (SELECT brand_id FROM brands WHERE name='HP'),
 'Unit refurbished HP 14s yang sudah melalui penggantian baterai baru dan instalasi ulang Windows 11 berlisensi. Casing dipoles ulang sehingga tampilannya kembali segar. Pilihan paling murah untuk kebutuhan mengetik dan browsing dengan garansi toko 6 bulan.',
 '["/laptops/HP-14S.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> AMD Ryzen 3 5300U (4 core / 8 thread)</li><li><strong>Grafis:</strong> AMD Radeon Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci, 1366 x 768 piksel</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>USB-C, 2x USB Type-A, HDMI 1.4b, slot SD</li><li>Wi-Fi 5, Bluetooth 4.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 41 Wh (baterai baru)</li><li><strong>Berat:</strong> 1,46 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; casing dipoles ulang</li><li><strong>Sudah dilakukan:</strong> ganti baterai baru, instal ulang Windows berlisensi, uji fungsi penuh</li><li><strong>Kelengkapan:</strong> unit dan charger baru</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Refurbished'), '6 Bulan Garansi Toko', 1460, TIMESTAMP '2024-12-20 10:45:00', CURRENT_TIMESTAMP
),

-- ============================== DELL ==============================
(
 'DELL-XPS-15', 'SN-DELLXPS-0001', 'Dell XPS 15 9530', 30000000, 27000000,
 (SELECT brand_id FROM brands WHERE name='Dell'),
 'XPS 15 adalah pilihan utama kreator yang butuh layar akurat dalam bodi ringkas. Sasis aluminium CNC dengan sandaran tangan serat karbon terasa kokoh sekaligus ringan. Core i7-13700H dan RTX 4050 mempercepat rendering video maupun ekspor foto, sementara layar InfinityEdge nyaris tanpa bingkai.',
 '["/laptops/DELL-XPS-15.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i7-13700H (14 core / 20 thread, hingga 5,0 GHz)</li><li><strong>Grafis:</strong> NVIDIA GeForce RTX 4050 6 GB GDDR6</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB DDR5-4800 (2 slot SO-DIMM, maks 64 GB)</li><li><strong>Penyimpanan:</strong> SSD 1 TB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci InfinityEdge, rasio 16:10</li><li><strong>Resolusi:</strong> 1920 x 1200 piksel (FHD+)</li><li><strong>Kecerahan:</strong> 500 nits, 100% sRGB, anti-glare</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4</li><li>1x USB-C 3.2 Gen 2</li><li>Slot kartu SD, jack combo audio (adaptor USB-A dan HDMI disertakan)</li><li>Wi-Fi 6E, Bluetooth 5.3</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 86 Wh, adaptor 130W USB-C</li><li><strong>Berat:</strong> 1,92 kg</li><li><strong>Bodi:</strong> aluminium CNC, sandaran tangan serat karbon</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi Dell', 1920, TIMESTAMP '2024-12-20 10:50:00', CURRENT_TIMESTAMP
),
(
 'DELL-INSP-15', 'SN-DELLINSP-0001', 'Dell Inspiron 15 3520', 9500000, 8500000,
 (SELECT brand_id FROM brands WHERE name='Dell'),
 'Inspiron 15 3520 memberi layar 15,6 inci yang lapang dengan refresh rate 120Hz, sesuatu yang jarang ada di kelas harganya. Core i5-1235U menjaga multitasking tetap lancar, dan keyboard ukuran penuh dengan numpad mempercepat input data. Pilihan praktis untuk kerja kantoran dan kuliah.',
 '["/laptops/DELL-INSP-15.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1235U (10 core / 12 thread, hingga 4,4 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-2666 (2 slot SO-DIMM, maks 16 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci WVA anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Refresh Rate:</strong> 120 Hz, 250 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 1 (DisplayPort)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 1.4, slot kartu SD, jack combo audio</li><li>Wi-Fi 5, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 54 Wh, adaptor 65W</li><li><strong>Berat:</strong> 1,65 kg</li><li><strong>Keyboard:</strong> ukuran penuh dengan numpad</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi Dell', 1650, TIMESTAMP '2024-12-20 10:55:00', CURRENT_TIMESTAMP
),
(
 'DELL-INSP-15-S', 'SN-DELLINSP-0002', 'Dell Inspiron 15 3520 (Second)', 6400000, 5300000,
 (SELECT brand_id FROM brands WHERE name='Dell'),
 'Inspiron 15 3520 bekas pemakaian rumahan, kondisi masih sangat layak. Sudah ditambah RAM 8 GB sehingga total menjadi 16 GB. Layar 120Hz-nya bersih, dan engsel masih kencang tanpa gejala longgar.',
 '["/laptops/DELL-INSP-15.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1235U (10 core / 12 thread)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB DDR4-2666 (sudah di-upgrade)</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci WVA, 1920 x 1080, 120 Hz</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>USB-C, 2x USB Type-A, HDMI 1.4, slot SD</li><li>Wi-Fi 5, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 54 Wh</li><li><strong>Berat:</strong> 1,65 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> B+ &ndash; baret halus di sandaran tangan</li><li><strong>Usia pakai:</strong> 1 tahun 6 bulan</li><li><strong>Bonus:</strong> RAM sudah di-upgrade ke 16 GB</li><li><strong>Kelengkapan:</strong> unit dan charger original</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1650, TIMESTAMP '2024-12-20 11:00:00', CURRENT_TIMESTAMP
),
(
 'DELL-VOS-3520', 'SN-DELLVOS-0001', 'Dell Vostro 15 3520', 9200000, 8300000,
 (SELECT brand_id FROM brands WHERE name='Dell'),
 'Vostro 15 3520 dirancang untuk usaha kecil yang membutuhkan laptop kerja yang tahan banting dan mudah dirawat. Port LAN bawaan memudahkan koneksi ke jaringan kantor, dan Dell Optimizer mempercepat aplikasi yang paling sering dipakai. Layar 120Hz membuat menggulir dokumen terasa nyaman.',
 '["/laptops/DELL-VOS-3520.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1235U (10 core / 12 thread, hingga 4,4 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200 (2 slot SO-DIMM, maks 16 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 3.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci WVA anti-glare</li><li><strong>Resolusi:</strong> 1920 x 1080 piksel (FHD)</li><li><strong>Refresh Rate:</strong> 120 Hz, 250 nits</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 1 (DisplayPort)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 1.4, RJ45 LAN, slot kartu SD</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Keamanan</h2><ul><li>Pemindai sidik jari pada tombol daya</li><li>Penutup privasi kamera, slot kunci Wedge</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 54 Wh, ExpressCharge</li><li><strong>Berat:</strong> 1,66 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Pro</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi Dell', 1660, TIMESTAMP '2024-12-20 11:05:00', CURRENT_TIMESTAMP
),
(
 'DELL-VOS-3520-R', 'SN-DELLVOS-0002', 'Dell Vostro 15 3520 (Refurbished)', 6900000, 5700000,
 (SELECT brand_id FROM brands WHERE name='Dell'),
 'Vostro 15 3520 refurbished eks perusahaan, sudah melewati pemeriksaan 30 titik dan instalasi ulang Windows 11 Pro berlisensi. Baterai diganti baru dan seluruh port sudah diuji satu per satu. Cocok untuk kebutuhan kantor dengan anggaran ketat.',
 '["/laptops/DELL-VOS-3520.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-1235U (10 core / 12 thread)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 8 GB DDR4-3200</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci WVA, 1920 x 1080, 120 Hz</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>USB-C, 2x USB Type-A, HDMI 1.4, RJ45 LAN, slot SD</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 54 Wh (baterai baru)</li><li><strong>Berat:</strong> 1,66 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Pro (lisensi digital)</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; eks perusahaan, fisik rapi</li><li><strong>Sudah dilakukan:</strong> pemeriksaan 30 titik, ganti baterai, instal ulang Windows Pro</li><li><strong>Kelengkapan:</strong> unit dan adaptor 65W</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Refurbished'), '6 Bulan Garansi Toko', 1660, TIMESTAMP '2024-12-20 11:10:00', CURRENT_TIMESTAMP
),
(
 'DELL-G15-5521', 'SN-DELLG15-0001', 'Dell G15 5521 Special Edition', 16500000, 14800000,
 (SELECT brand_id FROM brands WHERE name='Dell'),
 'G15 Special Edition membawa panel QHD 240Hz yang jarang ditemui di kelas ini, dipasangkan dengan RTX 3060 bertenaga 115W. Core i7-12700H 14 inti memberi ruang lega untuk streaming sambil bermain. Sistem pendingin turunan Alienware dengan empat ventilasi menjaga suhu tetap terkendali.',
 '["/laptops/DELL-G15-5521.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i7-12700H (14 core / 20 thread, hingga 4,7 GHz)</li><li><strong>Grafis:</strong> NVIDIA GeForce RTX 3060 6 GB GDDR6, TGP 115W</li><li><strong>Pendingin:</strong> turunan Alienware, 4 ventilasi, dual fan</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB DDR5-4800 (2 slot SO-DIMM, maks 64 GB)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 15,6 inci anti-glare</li><li><strong>Resolusi:</strong> 2560 x 1440 piksel (QHD)</li><li><strong>Refresh Rate:</strong> 240 Hz, response 3 ms, 100% sRGB</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>1x USB-C 3.2 Gen 2 (DisplayPort)</li><li>3x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.1, RJ45 LAN, jack combo audio</li><li>Wi-Fi 6, Bluetooth 5.2</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 86 Wh, adaptor 240W</li><li><strong>Berat:</strong> 2,81 kg</li><li><strong>Keyboard:</strong> backlit RGB 4 zona, numpad penuh</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '1 Tahun Resmi Dell', 2810, TIMESTAMP '2024-12-20 11:15:00', CURRENT_TIMESTAMP
),

-- ============================== ACER ==============================
(
 'ACER-SWF-GO14', 'SN-ACERSWF-0001', 'Acer Swift Go 14 SFG14-71', 8900000, 8000000,
 (SELECT brand_id FROM brands WHERE name='Acer'),
 'Swift Go 14 menawarkan layar OLED 2.8K 90Hz pada bobot hanya 1,25 kg, kombinasi yang sulit ditandingi di rentang harganya. Core i5-13500H dua belas inti membuatnya sanggup mengerjakan editing ringan dan multitasking berat. Dua port Thunderbolt 4 memudahkan menyambung ke monitor eksternal maupun docking.',
 '["/laptops/ACER-SWF-GO14.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-13500H (12 core / 16 thread, hingga 4,7 GHz)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics terintegrasi</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB LPDDR5-5200 (onboard)</li><li><strong>Penyimpanan:</strong> SSD 512 GB PCIe 4.0 NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci OLED, rasio 16:10</li><li><strong>Resolusi:</strong> 2880 x 1800 piksel (2.8K)</li><li><strong>Refresh Rate:</strong> 90 Hz</li><li><strong>Warna:</strong> 100% DCI-P3, DisplayHDR True Black 500</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4 (DisplayPort + Power Delivery)</li><li>2x USB 3.2 Gen 1 Type-A</li><li>HDMI 2.1, slot microSD, jack combo audio</li><li>Wi-Fi 6E, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 65 Wh, fast charge 4 jam dalam 30 menit</li><li><strong>Berat:</strong> 1,25 kg</li><li><strong>Kamera:</strong> 1440p QHD dengan Acer PurifiedView</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='New'), '2 Tahun Resmi Acer', 1250, TIMESTAMP '2024-12-20 11:20:00', CURRENT_TIMESTAMP
),
(
 'ACER-SWF-GO14-S', 'SN-ACERSWF-0002', 'Acer Swift Go 14 SFG14-71 (Second)', 6100000, 5000000,
 (SELECT brand_id FROM brands WHERE name='Acer'),
 'Swift Go 14 bekas pemakaian pribadi selama sepuluh bulan, kondisi mulus. Panel OLED-nya masih pekat tanpa gejala burn-in, dan baterai masih sanggup 7 jam pemakaian campuran. Sudah termasuk sleeve bawaan dan charger original.',
 '["/laptops/ACER-SWF-GO14.png"]'::jsonb,
 to_jsonb($$<h2>Prosesor &amp; Grafis</h2><ul><li><strong>Prosesor:</strong> Intel Core i5-13500H (12 core / 16 thread)</li><li><strong>Grafis:</strong> Intel Iris Xe Graphics</li></ul><h2>Memori &amp; Penyimpanan</h2><ul><li><strong>RAM:</strong> 16 GB LPDDR5 onboard</li><li><strong>Penyimpanan:</strong> SSD 512 GB NVMe</li></ul><h2>Layar</h2><ul><li><strong>Ukuran:</strong> 14 inci OLED, 2880 x 1800, 90 Hz</li></ul><h2>Konektivitas &amp; Port</h2><ul><li>2x Thunderbolt 4, 2x USB Type-A, HDMI 2.1, microSD</li><li>Wi-Fi 6E, Bluetooth 5.1</li></ul><h2>Baterai &amp; Fisik</h2><ul><li><strong>Baterai:</strong> 65 Wh</li><li><strong>Berat:</strong> 1,25 kg</li><li><strong>Sistem Operasi:</strong> Windows 11 Home</li></ul><h2>Catatan Kondisi</h2><ul><li><strong>Grade:</strong> A &ndash; mulus, layar bebas burn-in</li><li><strong>Usia pakai:</strong> 10 bulan</li><li><strong>Daya tahan baterai:</strong> sekitar 7 jam pemakaian campuran</li><li><strong>Kelengkapan:</strong> unit, charger original, sleeve bawaan</li></ul>$$::text),
 (SELECT condition_id FROM conditions WHERE name='Second'), '1 Bulan Garansi Toko', 1250, TIMESTAMP '2024-12-20 11:25:00', CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 4. Customer (12 orang). Password semuanya: password123
-- ---------------------------------------------------------------------
CREATE TEMP TABLE cust_seed (
    name VARCHAR(150), email VARCHAR(50), phone VARCHAR(25),
    address VARCHAR(255), city VARCHAR(50), province VARCHAR(50)
) ON COMMIT DROP;

INSERT INTO cust_seed VALUES
('Budi Santoso',        'budi.santoso@gmail.com',      '081234567801', 'Jl. Merdeka No. 12, Sumur Bandung',        'Bandung',         'Jawa Barat'),
('Siti Rahmawati',      'siti.rahmawati@gmail.com',    '081234567802', 'Jl. Diponegoro No. 45, Candisari',         'Semarang',        'Jawa Tengah'),
('Agus Prasetyo',       'agus.prasetyo@gmail.com',     '081234567803', 'Jl. Ahmad Yani No. 8, Gubeng',             'Surabaya',        'Jawa Timur'),
('Dewi Lestari',        'dewi.lestari@gmail.com',      '081234567804', 'Jl. Gatot Subroto No. 21, Setiabudi',      'Jakarta Selatan', 'DKI Jakarta'),
('Rizky Firmansyah',    'rizky.firmansyah@gmail.com',  '081234567805', 'Jl. Sudirman No. 77, Medan Baru',          'Medan',           'Sumatera Utara'),
('Putri Ayu Wulandari', 'putri.wulandari@gmail.com',   '081234567806', 'Jl. Pahlawan No. 3, Gondokusuman',         'Yogyakarta',      'DI Yogyakarta'),
('Andi Nugroho',        'andi.nugroho@gmail.com',      '081234567807', 'Jl. Cendrawasih No. 19, Mariso',           'Makassar',        'Sulawesi Selatan'),
('Maya Kusuma',         'maya.kusuma@gmail.com',       '081234567808', 'Jl. Kartini No. 56, Klojen',               'Malang',          'Jawa Timur'),
('Fajar Hidayat',       'fajar.hidayat@gmail.com',     '081234567809', 'Jl. Veteran No. 90, Denpasar Barat',       'Denpasar',        'Bali'),
('Nurul Aini',          'nurul.aini@gmail.com',        '081234567810', 'Jl. Imam Bonjol No. 14, Ilir Barat I',     'Palembang',       'Sumatera Selatan'),
('Hendra Wijaya',       'hendra.wijaya@gmail.com',     '081234567811', 'Jl. Asia Afrika No. 33, Regol',            'Bandung',         'Jawa Barat'),
('Rina Marlina',        'rina.marlina@gmail.com',      '081234567812', 'Jl. Panglima Polim No. 5, Kebayoran Baru', 'Jakarta Selatan', 'DKI Jakarta');

-- profiles.city_id / province_id bertipe UUID (relasi ke master wilayah yang
-- belum ada isinya), jadi nama kota & provinsi disimpan di alamat dan di
-- shipping_addr order, bukan di kolom itu.
WITH ins_profile AS (
    INSERT INTO "profiles" ("name", "phone", "address")
    SELECT name, phone, address || ', ' || city || ', ' || province FROM cust_seed
    RETURNING "profile_id", "name"
), ins_user AS (
    INSERT INTO "users" ("email", "password_hash", "role", "created_at", "updated_at", "profile_id")
    SELECT c.email,
           '$2b$10$xC/hWtuN788gj5saGqEsGeqwqaeEnnyEV3R3p9SfoKn4cEL5Os.we', -- password123
           'CUSTOMER',
           TIMESTAMP '2024-12-01 08:00:00',
           CURRENT_TIMESTAMP,
           p."profile_id"
    FROM cust_seed c
    JOIN ins_profile p ON p."name" = c.name
    RETURNING "user_id"
)
INSERT INTO "registers" ("is_email_verified", "user_id")
SELECT true, "user_id" FROM ins_user;

-- ---------------------------------------------------------------------
-- 5. Barang masuk: 6 nota pembelian tersebar Jan 2025 - Apr 2026.
--    Tiap nota memasukkan seluruh produk dengan qty berbeda,
--    total 48 unit per produk -- cukup untuk menutup semua penjualan.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE inbound_seed (receipt_url VARCHAR(255), notes TEXT, qty INT, created_at TIMESTAMP) ON COMMIT DROP;

INSERT INTO inbound_seed VALUES
('/uploads/receipts/NOTA-EMB-20250108.pdf', 'Pembelian awal tahun dari PT Sinar Komputer Nusantara',      10, TIMESTAMP '2025-01-08 10:00:00'),
('/uploads/receipts/NOTA-EMB-20250410.pdf', 'Restock kuartal II dari PT Sinar Komputer Nusantara',         8, TIMESTAMP '2025-04-10 10:30:00'),
('/uploads/receipts/NOTA-EMB-20250714.pdf', 'Restock menjelang tahun ajaran baru dari CV Mitra Laptop',    9, TIMESTAMP '2025-07-14 09:45:00'),
('/uploads/receipts/NOTA-EMB-20251006.pdf', 'Restock kuartal IV dari PT Sinar Komputer Nusantara',         7, TIMESTAMP '2025-10-06 11:15:00'),
('/uploads/receipts/NOTA-EMB-20260112.pdf', 'Pembelian awal tahun 2026 dari CV Mitra Laptop',              8, TIMESTAMP '2026-01-12 10:00:00'),
('/uploads/receipts/NOTA-EMB-20260415.pdf', 'Restock kuartal II 2026 dari PT Sinar Komputer Nusantara',    6, TIMESTAMP '2026-04-15 13:20:00');

WITH ins_inbound AS (
    INSERT INTO "inbound_transactions" ("receipt_url", "total_items_on_receipt", "notes", "created_at", "updated_at")
    SELECT s.receipt_url,
           s.qty * (SELECT count(*) FROM "products"),
           s.notes,
           s.created_at,
           s.created_at
    FROM inbound_seed s
    RETURNING "inbound_transaction_id", "receipt_url"
)
INSERT INTO "inbound_items" ("inbound_transaction_id", "product_id", "qty", "buy_price", "price")
SELECT i."inbound_transaction_id", p."product_id", s.qty, p."buy_price", p."price"
FROM ins_inbound i
JOIN inbound_seed s ON s.receipt_url = i."receipt_url"
CROSS JOIN "products" p;

-- ---------------------------------------------------------------------
-- 6. Order. Satu baris = satu item pesanan; header order diturunkan
--    dengan agregasi supaya total selalu konsisten dengan itemnya.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE order_seed (
    order_id VARCHAR(100), email VARCHAR(50), sku VARCHAR(100),
    qty INT, status TEXT, shipping_service VARCHAR(100), created_at TIMESTAMP
) ON COMMIT DROP;

INSERT INTO order_seed VALUES
  ('TR22012025-0002', 'fajar.hidayat@gmail.com', 'LEN-TP-T480', 1, 'COMPLETED', 'SiCepat BEST', '2025-01-22 16:04:00'),
  ('TR13012025-0001', 'siti.rahmawati@gmail.com', 'ACER-SWF-GO14-S', 1, 'COMPLETED', 'JNE REG', '2025-01-13 15:49:00'),
  ('TR13012025-0001', 'siti.rahmawati@gmail.com', 'DELL-INSP-15-S', 1, 'COMPLETED', 'JNE REG', '2025-01-13 15:49:00'),
  ('TR05012025-0002', 'putri.wulandari@gmail.com', 'LEN-TP-X1C', 1, 'COMPLETED', 'AnterAja Reguler', '2025-01-05 09:20:00'),
  ('TR15012025-0003', 'maya.kusuma@gmail.com', 'LEN-TP-T480', 1, 'COMPLETED', 'J&T Express', '2025-01-15 10:47:00'),
  ('TR02012025-0003', 'rina.marlina@gmail.com', 'ASUS-TUF-F15', 1, 'COMPLETED', 'AnterAja Reguler', '2025-01-02 12:23:00'),
  ('TR02012025-0003', 'rina.marlina@gmail.com', 'DELL-INSP-15-S', 1, 'COMPLETED', 'AnterAja Reguler', '2025-01-02 12:23:00'),
  ('TR20022025-0003', 'rina.marlina@gmail.com', 'ASUS-VIVO-GO14-S', 1, 'PENDING', 'AnterAja Reguler', '2025-02-20 16:48:00'),
  ('TR09022025-0001', 'nurul.aini@gmail.com', 'ACER-SWF-GO14', 1, 'COMPLETED', 'JNE REG', '2025-02-09 18:47:00'),
  ('TR23022025-0001', 'rizky.firmansyah@gmail.com', 'ASUS-ROG-G16', 1, 'SHIPPED', 'POS Kilat', '2025-02-23 16:41:00'),
  ('TR08022025-0003', 'agus.prasetyo@gmail.com', 'HP-14S', 1, 'PROCESSING', 'J&T Express', '2025-02-08 17:54:00'),
  ('TR08022025-0003', 'agus.prasetyo@gmail.com', 'DELL-XPS-15', 1, 'PROCESSING', 'J&T Express', '2025-02-08 17:54:00'),
  ('TR04022025-0002', 'siti.rahmawati@gmail.com', 'ACER-SWF-GO14', 1, 'PROCESSING', 'JNE REG', '2025-02-04 18:45:00'),
  ('TR19032025-0002', 'fajar.hidayat@gmail.com', 'DELL-VOS-3520', 1, 'COMPLETED', 'POS Kilat', '2025-03-19 14:32:00'),
  ('TR19032025-0002', 'fajar.hidayat@gmail.com', 'ACER-SWF-GO14', 2, 'COMPLETED', 'POS Kilat', '2025-03-19 14:32:00'),
  ('TR01032025-0001', 'siti.rahmawati@gmail.com', 'HP-PAV-14', 1, 'SHIPPED', 'AnterAja Reguler', '2025-03-01 19:41:00'),
  ('TR03032025-0002', 'fajar.hidayat@gmail.com', 'LEN-TP-X1C', 1, 'PROCESSING', 'JNE REG', '2025-03-03 19:54:00'),
  ('TR04032025-0002', 'siti.rahmawati@gmail.com', 'LEN-IP-SLIM3', 1, 'SHIPPED', 'AnterAja Reguler', '2025-03-04 18:52:00'),
  ('TR02032025-0002', 'maya.kusuma@gmail.com', 'HP-14S', 1, 'COMPLETED', 'AnterAja Reguler', '2025-03-02 12:42:00'),
  ('TR26042025-0003', 'putri.wulandari@gmail.com', 'APL-MBA-M2-8256', 1, 'COMPLETED', 'JNE REG', '2025-04-26 08:07:00'),
  ('TR02042025-0001', 'rina.marlina@gmail.com', 'DELL-INSP-15', 1, 'COMPLETED', 'SiCepat BEST', '2025-04-02 12:11:00'),
  ('TR06042025-0002', 'maya.kusuma@gmail.com', 'APL-MBP-M3M-361T-R', 1, 'COMPLETED', 'SiCepat BEST', '2025-04-06 09:10:00'),
  ('TR05042025-0001', 'hendra.wijaya@gmail.com', 'ASUS-TUF-F15', 1, 'COMPLETED', 'SiCepat BEST', '2025-04-05 09:13:00'),
  ('TR19042025-0002', 'putri.wulandari@gmail.com', 'ACER-SWF-GO14', 1, 'CANCELLED', 'J&T Express', '2025-04-19 14:36:00'),
  ('TR19042025-0002', 'putri.wulandari@gmail.com', 'HP-PAV-14-S', 1, 'CANCELLED', 'J&T Express', '2025-04-19 14:36:00'),
  ('TR01052025-0003', 'maya.kusuma@gmail.com', 'DELL-INSP-15', 1, 'PROCESSING', 'J&T Express', '2025-05-01 18:50:00'),
  ('TR25052025-0001', 'siti.rahmawati@gmail.com', 'DELL-VOS-3520', 1, 'PROCESSING', 'AnterAja Reguler', '2025-05-25 18:27:00'),
  ('TR24052025-0001', 'rizky.firmansyah@gmail.com', 'ASUS-VIVO-GO14-S', 1, 'COMPLETED', 'SiCepat BEST', '2025-05-24 15:48:00'),
  ('TR21052025-0001', 'budi.santoso@gmail.com', 'HP-PAV-14-S', 1, 'COMPLETED', 'POS Kilat', '2025-05-21 19:26:00'),
  ('TR02052025-0001', 'rizky.firmansyah@gmail.com', 'LEN-IP-SLIM3', 1, 'COMPLETED', 'AnterAja Reguler', '2025-05-02 12:39:00'),
  ('TR25062025-0003', 'nurul.aini@gmail.com', 'HP-PAV-14-S', 1, 'COMPLETED', 'SiCepat BEST', '2025-06-25 14:15:00'),
  ('TR26062025-0002', 'agus.prasetyo@gmail.com', 'HP-VICT-15', 1, 'COMPLETED', 'J&T Express', '2025-06-26 14:49:00'),
  ('TR26062025-0002', 'agus.prasetyo@gmail.com', 'HP-PAV-14', 2, 'COMPLETED', 'J&T Express', '2025-06-26 14:49:00'),
  ('TR03062025-0001', 'andi.nugroho@gmail.com', 'ACER-SWF-GO14', 1, 'COMPLETED', 'POS Kilat', '2025-06-03 08:05:00'),
  ('TR09062025-0001', 'rina.marlina@gmail.com', 'DELL-INSP-15', 1, 'COMPLETED', 'SiCepat BEST', '2025-06-09 15:45:00'),
  ('TR21062025-0003', 'andi.nugroho@gmail.com', 'ACER-SWF-GO14-S', 1, 'COMPLETED', 'SiCepat BEST', '2025-06-21 10:25:00'),
  ('TR11072025-0002', 'putri.wulandari@gmail.com', 'APL-MBA-M2-8256', 1, 'COMPLETED', 'JNE REG', '2025-07-11 18:22:00'),
  ('TR24072025-0002', 'putri.wulandari@gmail.com', 'ASUS-ROG-G16', 1, 'COMPLETED', 'AnterAja Reguler', '2025-07-24 08:15:00'),
  ('TR20072025-0002', 'andi.nugroho@gmail.com', 'DELL-INSP-15-S', 1, 'COMPLETED', 'JNE REG', '2025-07-20 10:15:00'),
  ('TR21072025-0002', 'andi.nugroho@gmail.com', 'APL-MBA-M2-8256', 1, 'PENDING', 'AnterAja Reguler', '2025-07-21 11:50:00'),
  ('TR01072025-0003', 'fajar.hidayat@gmail.com', 'LEN-IP-SLIM3', 1, 'COMPLETED', 'J&T Express', '2025-07-01 11:36:00'),
  ('TR26082025-0002', 'maya.kusuma@gmail.com', 'HP-14S', 1, 'COMPLETED', 'J&T Express', '2025-08-26 19:11:00'),
  ('TR21082025-0001', 'dewi.lestari@gmail.com', 'ACER-SWF-GO14-S', 1, 'CANCELLED', 'POS Kilat', '2025-08-21 10:00:00'),
  ('TR20082025-0003', 'hendra.wijaya@gmail.com', 'LEN-TP-X1C', 1, 'PROCESSING', 'POS Kilat', '2025-08-20 18:16:00'),
  ('TR13082025-0003', 'siti.rahmawati@gmail.com', 'ASUS-VIVO-GO14', 1, 'COMPLETED', 'SiCepat BEST', '2025-08-13 18:39:00'),
  ('TR22082025-0003', 'rizky.firmansyah@gmail.com', 'DELL-VOS-3520', 1, 'COMPLETED', 'J&T Express', '2025-08-22 09:01:00'),
  ('TR12092025-0003', 'siti.rahmawati@gmail.com', 'DELL-INSP-15-S', 1, 'PROCESSING', 'POS Kilat', '2025-09-12 11:28:00'),
  ('TR02092025-0002', 'nurul.aini@gmail.com', 'DELL-INSP-15-S', 2, 'CANCELLED', 'JNE REG', '2025-09-02 10:41:00'),
  ('TR23092025-0002', 'dewi.lestari@gmail.com', 'ASUS-ROG-G16-S', 1, 'COMPLETED', 'AnterAja Reguler', '2025-09-23 10:50:00'),
  ('TR13092025-0001', 'budi.santoso@gmail.com', 'LEN-IP-SLIM3', 1, 'PROCESSING', 'SiCepat BEST', '2025-09-13 13:54:00'),
  ('TR13092025-0001', 'budi.santoso@gmail.com', 'APL-MBA-M2-8256', 1, 'PROCESSING', 'SiCepat BEST', '2025-09-13 13:54:00'),
  ('TR08092025-0002', 'dewi.lestari@gmail.com', 'DELL-VOS-3520', 1, 'COMPLETED', 'J&T Express', '2025-09-08 16:58:00'),
  ('TR08102025-0002', 'siti.rahmawati@gmail.com', 'ASUS-VIVO-GO14', 1, 'COMPLETED', 'AnterAja Reguler', '2025-10-08 11:51:00'),
  ('TR20102025-0003', 'rina.marlina@gmail.com', 'HP-PAV-14-S', 1, 'COMPLETED', 'J&T Express', '2025-10-20 10:02:00'),
  ('TR14102025-0002', 'hendra.wijaya@gmail.com', 'APL-MBA-M2-8256', 1, 'COMPLETED', 'J&T Express', '2025-10-14 11:59:00'),
  ('TR16102025-0001', 'fajar.hidayat@gmail.com', 'HP-14S', 1, 'PROCESSING', 'POS Kilat', '2025-10-16 18:05:00'),
  ('TR21102025-0003', 'andi.nugroho@gmail.com', 'ACER-SWF-GO14', 1, 'PROCESSING', 'J&T Express', '2025-10-21 14:30:00'),
  ('TR21102025-0003', 'andi.nugroho@gmail.com', 'DELL-INSP-15', 1, 'PROCESSING', 'J&T Express', '2025-10-21 14:30:00'),
  ('TR15112025-0003', 'rina.marlina@gmail.com', 'ASUS-VIVO-GO14', 1, 'CANCELLED', 'JNE REG', '2025-11-15 10:41:00'),
  ('TR15112025-0003', 'rina.marlina@gmail.com', 'HP-14S-R', 1, 'CANCELLED', 'JNE REG', '2025-11-15 10:41:00'),
  ('TR12112025-0001', 'fajar.hidayat@gmail.com', 'ASUS-ROG-G16-S', 1, 'COMPLETED', 'JNE REG', '2025-11-12 09:44:00'),
  ('TR12112025-0001', 'fajar.hidayat@gmail.com', 'HP-PAV-14-S', 1, 'COMPLETED', 'JNE REG', '2025-11-12 09:44:00'),
  ('TR27112025-0001', 'agus.prasetyo@gmail.com', 'HP-14S', 1, 'COMPLETED', 'POS Kilat', '2025-11-27 08:04:00'),
  ('TR27112025-0001', 'agus.prasetyo@gmail.com', 'LEN-YOGA-7I', 1, 'COMPLETED', 'POS Kilat', '2025-11-27 08:04:00'),
  ('TR26112025-0002', 'budi.santoso@gmail.com', 'ASUS-ZEN-14-OLED', 1, 'COMPLETED', 'AnterAja Reguler', '2025-11-26 10:56:00'),
  ('TR26112025-0002', 'budi.santoso@gmail.com', 'ASUS-ROG-G16-S', 1, 'COMPLETED', 'AnterAja Reguler', '2025-11-26 10:56:00'),
  ('TR08112025-0002', 'dewi.lestari@gmail.com', 'DELL-VOS-3520-R', 1, 'COMPLETED', 'SiCepat BEST', '2025-11-08 16:59:00'),
  ('TR24122025-0002', 'andi.nugroho@gmail.com', 'HP-PAV-14', 1, 'COMPLETED', 'AnterAja Reguler', '2025-12-24 14:07:00'),
  ('TR10122025-0001', 'nurul.aini@gmail.com', 'APL-MBP-M3M-361T-R', 1, 'PROCESSING', 'POS Kilat', '2025-12-10 16:12:00'),
  ('TR10122025-0001', 'nurul.aini@gmail.com', 'HP-14S-R', 1, 'PROCESSING', 'POS Kilat', '2025-12-10 16:12:00'),
  ('TR27122025-0003', 'agus.prasetyo@gmail.com', 'HP-14S', 1, 'COMPLETED', 'AnterAja Reguler', '2025-12-27 16:23:00'),
  ('TR07122025-0003', 'hendra.wijaya@gmail.com', 'ASUS-VIVO-GO14', 1, 'COMPLETED', 'POS Kilat', '2025-12-07 13:13:00'),
  ('TR07122025-0003', 'hendra.wijaya@gmail.com', 'APL-MBA-M2-8256-S', 1, 'COMPLETED', 'POS Kilat', '2025-12-07 13:13:00'),
  ('TR14122025-0003', 'maya.kusuma@gmail.com', 'LEN-TP-T480', 1, 'COMPLETED', 'AnterAja Reguler', '2025-12-14 13:37:00'),
  ('TR07012026-0003', 'putri.wulandari@gmail.com', 'ACER-SWF-GO14', 1, 'COMPLETED', 'JNE REG', '2026-01-07 10:44:00'),
  ('TR11012026-0003', 'putri.wulandari@gmail.com', 'DELL-VOS-3520', 1, 'SHIPPED', 'J&T Express', '2026-01-11 08:35:00'),
  ('TR14012026-0002', 'rina.marlina@gmail.com', 'APL-MBA-M2-8256', 1, 'COMPLETED', 'SiCepat BEST', '2026-01-14 10:28:00'),
  ('TR21012026-0001', 'siti.rahmawati@gmail.com', 'LEN-TP-T480', 1, 'COMPLETED', 'AnterAja Reguler', '2026-01-21 19:21:00'),
  ('TR15012026-0003', 'nurul.aini@gmail.com', 'LEN-IP-SLIM3-S', 1, 'COMPLETED', 'JNE REG', '2026-01-15 12:55:00'),
  ('TR07022026-0003', 'siti.rahmawati@gmail.com', 'DELL-VOS-3520', 2, 'PROCESSING', 'POS Kilat', '2026-02-07 18:32:00'),
  ('TR15022026-0002', 'maya.kusuma@gmail.com', 'DELL-XPS-15', 1, 'CANCELLED', 'AnterAja Reguler', '2026-02-15 11:35:00'),
  ('TR15022026-0002', 'maya.kusuma@gmail.com', 'HP-PAV-14-S', 1, 'CANCELLED', 'AnterAja Reguler', '2026-02-15 11:35:00'),
  ('TR13022026-0003', 'rina.marlina@gmail.com', 'DELL-INSP-15', 1, 'COMPLETED', 'AnterAja Reguler', '2026-02-13 09:17:00'),
  ('TR22022026-0001', 'rizky.firmansyah@gmail.com', 'LEN-TP-T480', 1, 'COMPLETED', 'AnterAja Reguler', '2026-02-22 12:46:00'),
  ('TR22022026-0001', 'rizky.firmansyah@gmail.com', 'ASUS-VIVO-GO14', 1, 'COMPLETED', 'AnterAja Reguler', '2026-02-22 12:46:00'),
  ('TR17022026-0001', 'maya.kusuma@gmail.com', 'DELL-INSP-15-S', 2, 'PENDING', 'JNE REG', '2026-02-17 12:41:00'),
  ('TR18032026-0002', 'rizky.firmansyah@gmail.com', 'ACER-SWF-GO14-S', 1, 'SHIPPED', 'J&T Express', '2026-03-18 16:36:00'),
  ('TR16032026-0001', 'budi.santoso@gmail.com', 'DELL-INSP-15', 1, 'SHIPPED', 'SiCepat BEST', '2026-03-16 12:06:00'),
  ('TR24032026-0002', 'budi.santoso@gmail.com', 'ACER-SWF-GO14-S', 1, 'COMPLETED', 'AnterAja Reguler', '2026-03-24 16:06:00'),
  ('TR05032026-0003', 'agus.prasetyo@gmail.com', 'LEN-TP-T480', 1, 'CANCELLED', 'JNE REG', '2026-03-05 16:04:00'),
  ('TR05032026-0003', 'agus.prasetyo@gmail.com', 'ASUS-VIVO-GO14-S', 1, 'CANCELLED', 'JNE REG', '2026-03-05 16:04:00'),
  ('TR12032026-0002', 'putri.wulandari@gmail.com', 'HP-PAV-14-S', 1, 'COMPLETED', 'POS Kilat', '2026-03-12 19:17:00'),
  ('TR12032026-0002', 'putri.wulandari@gmail.com', 'DELL-VOS-3520', 1, 'COMPLETED', 'POS Kilat', '2026-03-12 19:17:00'),
  ('TR23042026-0001', 'siti.rahmawati@gmail.com', 'HP-PAV-14-S', 1, 'COMPLETED', 'POS Kilat', '2026-04-23 18:51:00'),
  ('TR23042026-0001', 'siti.rahmawati@gmail.com', 'ASUS-ROG-G16', 1, 'COMPLETED', 'POS Kilat', '2026-04-23 18:51:00'),
  ('TR11042026-0002', 'fajar.hidayat@gmail.com', 'HP-PAV-14', 1, 'PROCESSING', 'JNE REG', '2026-04-11 10:25:00'),
  ('TR06042026-0002', 'agus.prasetyo@gmail.com', 'LEN-IP-SLIM3', 1, 'COMPLETED', 'POS Kilat', '2026-04-06 12:44:00'),
  ('TR17042026-0003', 'nurul.aini@gmail.com', 'ASUS-ROG-G16-S', 1, 'COMPLETED', 'AnterAja Reguler', '2026-04-17 11:55:00'),
  ('TR05042026-0002', 'andi.nugroho@gmail.com', 'LEN-YOGA-7I', 1, 'PROCESSING', 'AnterAja Reguler', '2026-04-05 12:14:00'),
  ('TR13052026-0001', 'rizky.firmansyah@gmail.com', 'HP-PAV-14', 1, 'COMPLETED', 'SiCepat BEST', '2026-05-13 13:58:00'),
  ('TR13052026-0001', 'rizky.firmansyah@gmail.com', 'LEN-TP-T480', 1, 'COMPLETED', 'SiCepat BEST', '2026-05-13 13:58:00'),
  ('TR06052026-0001', 'fajar.hidayat@gmail.com', 'HP-14S-R', 1, 'CANCELLED', 'J&T Express', '2026-05-06 08:56:00'),
  ('TR27052026-0002', 'siti.rahmawati@gmail.com', 'HP-14S', 1, 'SHIPPED', 'POS Kilat', '2026-05-27 14:14:00'),
  ('TR25052026-0001', 'rizky.firmansyah@gmail.com', 'ASUS-VIVO-GO14', 1, 'COMPLETED', 'SiCepat BEST', '2026-05-25 12:02:00'),
  ('TR21052026-0003', 'andi.nugroho@gmail.com', 'HP-VICT-15', 1, 'COMPLETED', 'POS Kilat', '2026-05-21 14:23:00'),
  ('TR21052026-0003', 'andi.nugroho@gmail.com', 'ASUS-TUF-F15', 1, 'COMPLETED', 'POS Kilat', '2026-05-21 14:23:00'),
  ('TR25062026-0001', 'fajar.hidayat@gmail.com', 'HP-VICT-15', 1, 'COMPLETED', 'JNE REG', '2026-06-25 09:15:00'),
  ('TR16062026-0003', 'putri.wulandari@gmail.com', 'ACER-SWF-GO14', 1, 'SHIPPED', 'POS Kilat', '2026-06-16 16:05:00'),
  ('TR08062026-0002', 'maya.kusuma@gmail.com', 'ACER-SWF-GO14', 1, 'PENDING', 'POS Kilat', '2026-06-08 17:23:00'),
  ('TR19062026-0002', 'dewi.lestari@gmail.com', 'DELL-INSP-15-S', 1, 'PENDING', 'AnterAja Reguler', '2026-06-19 12:03:00'),
  ('TR26062026-0003', 'siti.rahmawati@gmail.com', 'LEN-IP-SLIM3', 1, 'SHIPPED', 'AnterAja Reguler', '2026-06-26 10:57:00'),
  ('TR04072026-0002', 'hendra.wijaya@gmail.com', 'ASUS-VIVO-GO14', 1, 'SHIPPED', 'POS Kilat', '2026-07-04 09:50:00'),
  ('TR03072026-0003', 'hendra.wijaya@gmail.com', 'ACER-SWF-GO14-S', 1, 'SHIPPED', 'AnterAja Reguler', '2026-07-03 17:45:00'),
  ('TR07072026-0001', 'budi.santoso@gmail.com', 'LEN-TP-T480', 1, 'SHIPPED', 'JNE REG', '2026-07-07 08:27:00');

-- Header order. Rumus biaya mengikuti order.service.ts:
--   total_grand = subtotal + ongkir + app_fee(1000)
--   tax_amount  = subtotal - subtotal / 1.11   (PPN 11% sudah termasuk harga)
INSERT INTO "orders" (
    "order_id", "profile_id", "total_grand", "shipping_cost", "shipping_service",
    "status", "shipping_addr", "phone", "tracking_no", "estimated_days",
    "shipped_at", "tax_amount", "app_fee", "created_at", "updated_at"
)
SELECT
    a.order_id,
    pr."profile_id",
    a.subtotal + a.ship + 1000,
    a.ship,
    a.shipping_service,
    a.status::"OrderStatus",
    jsonb_build_object(
        'name', pr."name", 'phone', pr."phone", 'address', cs.address,
        'city', cs.city, 'province', cs.province
    ),
    pr."phone",
    CASE WHEN a.status IN ('SHIPPED', 'COMPLETED')
         THEN 'EMB' || to_char(a.created_at, 'YYYYMMDD') || right(a.order_id, 4)
    END,
    CASE a.shipping_service
        WHEN 'JNE REG' THEN 3 WHEN 'J&T Express' THEN 2
        WHEN 'SiCepat BEST' THEN 2 WHEN 'AnterAja Reguler' THEN 3 ELSE 4
    END,
    CASE WHEN a.status IN ('SHIPPED', 'COMPLETED') THEN a.created_at + INTERVAL '2 days' END,
    round(a.subtotal - a.subtotal / 1.11),
    1000,
    a.created_at,
    a.created_at
FROM (
    SELECT s.order_id, s.email, s.status, s.shipping_service, s.created_at,
           SUM(p."price" * s.qty) AS subtotal,
           CASE s.shipping_service
               WHEN 'JNE REG' THEN 25000 WHEN 'J&T Express' THEN 22000
               WHEN 'SiCepat BEST' THEN 30000 WHEN 'AnterAja Reguler' THEN 20000
               ELSE 18000
           END AS ship
    FROM order_seed s
    JOIN "products" p ON p."sku" = s.sku
    GROUP BY s.order_id, s.email, s.status, s.shipping_service, s.created_at
) a
JOIN "users" u ON u."email" = a.email
JOIN "profiles" pr ON pr."profile_id" = u."profile_id"
JOIN cust_seed cs ON cs.email = a.email;

INSERT INTO "order_item" ("order_id", "product_id", "qty", "unit_price", "total_price")
SELECT s.order_id, p."product_id", s.qty, p."price", p."price" * s.qty
FROM order_seed s
JOIN "products" p ON p."sku" = s.sku;

-- Pembayaran: order berstatus PENDING belum punya baris pembayaran.
INSERT INTO "payments" (
    "order_id", "provider", "provider_id", "snap_token", "redirect_url",
    "amount", "status", "created_at", "updated_at", "paid_at"
)
SELECT
    o."order_id",
    'midtrans',
    'MT-' || o."order_id",
    md5(o."order_id" || 'snap'),
    'https://app.sandbox.midtrans.com/snap/v3/redirection/' || md5(o."order_id" || 'snap'),
    o."total_grand",
    (CASE WHEN o."status" = 'CANCELLED' THEN 'FAILED' ELSE 'PAID' END)::"PaymentStatus",
    o."created_at",
    o."created_at",
    CASE WHEN o."status" = 'CANCELLED' THEN NULL ELSE o."created_at" + INTERVAL '18 minutes' END
FROM "orders" o
WHERE o."status" <> 'PENDING';

-- Review untuk sebagian order yang sudah COMPLETED.
CREATE TEMP TABLE review_seed (order_id VARCHAR(100), rating INT, comment TEXT) ON COMMIT DROP;

INSERT INTO review_seed VALUES
  ('TR22012025-0002', 5, 'Barang sesuai deskripsi, pengiriman cepat. Recommended!'),
  ('TR13012025-0001', 5, 'Laptop mulus, performa lancar buat kerja harian. Puas banget.'),
  ('TR05012025-0002', 4, 'Packing rapi dan aman. Sudah dites semua normal.'),
  ('TR15012025-0003', 5, 'Harga bersaing, kondisi sesuai foto. Terima kasih Emobo.'),
  ('TR02012025-0003', 5, 'Baterai masih awet, layar bersih tanpa dead pixel.'),
  ('TR09022025-0001', 5, 'Pelayanan admin ramah, respon cepat. Bakal beli lagi.'),
  ('TR19032025-0002', 5, 'Sesuai ekspektasi, cuma dus agak penyok dikit pas sampai.'),
  ('TR02032025-0002', 5, 'Mantap, langsung dipakai buat kuliah. Nggak ada kendala.'),
  ('TR26042025-0003', 3, 'Unit oke, tapi pengiriman agak lama dari perkiraan.'),
  ('TR02042025-0001', 5, 'Laptop mulus, performa lancar buat kerja harian. Puas banget.'),
  ('TR06042025-0002', 4, 'Packing rapi dan aman. Sudah dites semua normal.'),
  ('TR05042025-0001', 3, 'Barang bagus, sayang bonus tasnya tidak ikut dikirim.'),
  ('TR24052025-0001', 5, 'Baterai masih awet, layar bersih tanpa dead pixel.'),
  ('TR21052025-0001', 4, 'Pelayanan admin ramah, respon cepat. Bakal beli lagi.'),
  ('TR02052025-0001', 5, 'Sesuai ekspektasi, cuma dus agak penyok dikit pas sampai.'),
  ('TR25062025-0003', 5, 'Mantap, langsung dipakai buat kuliah. Nggak ada kendala.'),
  ('TR26062025-0002', 5, 'Barang sesuai deskripsi, pengiriman cepat. Recommended!'),
  ('TR03062025-0001', 4, 'Laptop mulus, performa lancar buat kerja harian. Puas banget.'),
  ('TR09062025-0001', 4, 'Packing rapi dan aman. Sudah dites semua normal.'),
  ('TR21062025-0003', 5, 'Harga bersaing, kondisi sesuai foto. Terima kasih Emobo.'),
  ('TR11072025-0002', 5, 'Baterai masih awet, layar bersih tanpa dead pixel.'),
  ('TR24072025-0002', 5, 'Pelayanan admin ramah, respon cepat. Bakal beli lagi.'),
  ('TR20072025-0002', 4, 'Sesuai ekspektasi, cuma dus agak penyok dikit pas sampai.'),
  ('TR01072025-0003', 5, 'Mantap, langsung dipakai buat kuliah. Nggak ada kendala.'),
  ('TR26082025-0002', 4, 'Barang sesuai deskripsi, pengiriman cepat. Recommended!'),
  ('TR13082025-0003', 3, 'Fungsi normal semua, cuma charger-nya bukan yang original.'),
  ('TR22082025-0003', 3, 'Packing rapi dan aman. Sudah dites semua normal.'),
  ('TR23092025-0002', 5, 'Harga bersaing, kondisi sesuai foto. Terima kasih Emobo.');

INSERT INTO "reviews" ("order_id", "product_id", "profile_id", "rating", "comment", "created_at")
SELECT rs.order_id, first_item."product_id", o."profile_id", rs.rating, rs.comment,
       o."created_at" + INTERVAL '7 days'
FROM review_seed rs
JOIN "orders" o ON o."order_id" = rs.order_id
JOIN LATERAL (
    SELECT oi."product_id" FROM "order_item" oi
    WHERE oi."order_id" = rs.order_id
    ORDER BY oi."product_id" LIMIT 1
) first_item ON true;

-- ---------------------------------------------------------------------
-- 7. Stok berjalan = total barang masuk - total terjual. Order yang
--    dibatalkan tidak mengurangi stok. Mengikuti monitor_stock_view.
-- ---------------------------------------------------------------------
INSERT INTO "monitor_stock" ("product_id", "current_stock", "created_at", "updated_at")
SELECT p."product_id",
       COALESCE(i.qty_in, 0) - COALESCE(o.qty_out, 0),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "products" p
LEFT JOIN (
    SELECT "product_id", SUM("qty") AS qty_in FROM "inbound_items" GROUP BY "product_id"
) i ON i."product_id" = p."product_id"
LEFT JOIN (
    SELECT oi."product_id", SUM(oi."qty") AS qty_out
    FROM "order_item" oi
    JOIN "orders" o2 ON o2."order_id" = oi."order_id"
    WHERE o2."status" <> 'CANCELLED'
    GROUP BY oi."product_id"
) o ON o."product_id" = p."product_id";

-- ---------------------------------------------------------------------
-- 8. Sanity check. Kalau ada yang gagal, seluruh transaksi di-rollback.
-- ---------------------------------------------------------------------
DO $check$
BEGIN
    ASSERT (SELECT count(*) FROM "products") = 30,
        'harus ada tepat 30 produk';
    ASSERT (SELECT count(*) FROM "products" WHERE "price" < 10000000) > 15,
        'mayoritas produk harus di bawah 10 juta';
    ASSERT (SELECT count(*) FROM "products" WHERE jsonb_typeof("specifications") <> 'string') = 0,
        'specifications harus berupa string HTML, bukan objek JSON';
    ASSERT (SELECT count(*) FROM "users" WHERE "role" = 'CUSTOMER') = 12,
        'harus ada 12 customer';
    ASSERT NOT EXISTS (SELECT 1 FROM "monitor_stock" WHERE "current_stock" < 0),
        'stok tidak boleh negatif';
    ASSERT (SELECT count(DISTINCT date_trunc('month', "created_at")) FROM "orders") >= 18,
        'order harus tersebar minimal 18 bulan agar grafik terisi';
    ASSERT NOT EXISTS (
        SELECT 1 FROM "orders" o
        JOIN (SELECT "order_id", SUM("total_price") t FROM "order_item" GROUP BY 1) oi
             ON oi."order_id" = o."order_id"
        WHERE o."total_grand" <> oi.t + o."shipping_cost" + o."app_fee"
    ), 'total_grand harus sama dengan subtotal + ongkir + app_fee';
    ASSERT NOT EXISTS (
        SELECT 1 FROM "orders" WHERE "status" <> 'PENDING'
          AND "order_id" NOT IN (SELECT "order_id" FROM "payments")
    ), 'setiap order non-PENDING wajib punya pembayaran';
END
$check$;

COMMIT;
