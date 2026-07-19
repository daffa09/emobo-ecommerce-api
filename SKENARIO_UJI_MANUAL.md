# Skenario Uji Manual — Produk & Barang Masuk

Skenario input satu per satu lewat halaman Admin. Urutannya sengaja dibuat
berantai: produk yang dipakai di skenario Barang Masuk adalah produk yang
dibuat di skenario pertama, dan skenario hapus mendemokan dua perilaku
berbeda (hard delete vs soft delete) yang keduanya butuh langkah sebelumnya.

**Jalankan berurutan dari SKN-01 sampai SKN-06. Jangan diacak.**

---

## Persiapan

| Butuh | Di mana |
|---|---|
| Login admin | `admin@emobo.com` / `password123` |
| Gambar produk (3 file PNG) | `uploads/skenario/gambar/` |
| Nota barang masuk (2 file PDF) | `uploads/skenario/NOTA-SKENARIO-01.pdf` dan `-02.pdf` |

Kalau folder nota belum ada, buat dulu:

```bash
npx tsx scripts/generate-nota-skenario.ts
```

Cek juga master data sudah terisi — brand **Asus**, **HP**, **Lenovo** dan
kondisi **New** harus sudah ada di menu Brands & Conditions, karena dipilih
lewat dropdown saat input produk.

### Catatan penting soal harga

Form Tambah/Edit Produk **tidak punya kolom harga**. Harga modal dan harga
jual di sistem ini hanya bisa diisi lewat **Barang Masuk** (SKN-04). Jadi
produk yang baru dibuat wajar kalau harganya masih Rp 0 dan stoknya 0 —
itu bukan bug, memang alurnya begitu.

---

## SKN-01 — Tambah Produk (3 unit)

**Menu:** Admin → Manage Products → **Add New Product**

Ulangi 3× dengan data di bawah.

Kolom **Specifications** itu editor teks (TipTap), jadi diketik langsung —
bukan tempel HTML. Klik **Fill Template** buat dapat kerangkanya, lalu ikuti
susunan di bawah: baris **Judul** pakai format Heading, baris di bawahnya
pakai Bullet List.

### Produk A

| Kolom | Isi |
|---|---|
| Product Images | `uploads/skenario/gambar/ASUS-TUF-A15-DEMO.png` |
| SKU | `ASUS-TUF-A15-DEMO` |
| Brand | Asus |
| Condition | New |
| Product Name | `Asus TUF Gaming A15 FA506NF` |
| Warranty | `2 Tahun Resmi Asus` |
| Weight (kg) | `2.3` |
| Description | Laptop gaming entry level dengan Ryzen 5 7535HS dan RTX 2050, sasis lolos uji militer MIL-STD-810H. |

Specifications:

```
Prosesor & Grafis

- Prosesor: AMD Ryzen 5 7535HS (6 core / 12 thread)
- Grafis: NVIDIA GeForce RTX 2050 4 GB GDDR6

Memori & Penyimpanan

- RAM: 8 GB DDR5-4800
- Penyimpanan: SSD 512 GB PCIe 4.0 NVMe

Layar

- Ukuran: 15,6 inci IPS, 1920 x 1080
- Refresh Rate: 144 Hz
```

### Produk B

| Kolom | Isi |
|---|---|
| Product Images | `uploads/skenario/gambar/HP-VICT-16-DEMO.png` |
| SKU | `HP-VICT-16-DEMO` |
| Brand | HP |
| Condition | New |
| Product Name | `HP Victus 16 fb0121AX` |
| Warranty | `1 Tahun Resmi HP` |
| Weight (kg) | `2.4` |
| Description | Laptop gaming layar 16,1 inci dengan Ryzen 7 5800H dan RTX 3050 Ti, ruang keyboard lega untuk kerja dan main. |

Specifications:

```
Prosesor & Grafis

- Prosesor: AMD Ryzen 7 5800H (8 core / 16 thread)
- Grafis: NVIDIA GeForce RTX 3050 Ti 4 GB GDDR6

Memori & Penyimpanan

- RAM: 16 GB DDR4-3200
- Penyimpanan: SSD 512 GB NVMe

Layar

- Ukuran: 16,1 inci IPS, 1920 x 1080
- Refresh Rate: 144 Hz
```

### Produk C

| Kolom | Isi |
|---|---|
| Product Images | `uploads/skenario/gambar/LEN-IP-S5-DEMO.png` |
| SKU | `LEN-IP-S5-DEMO` |
| Brand | Lenovo |
| Condition | New |
| Product Name | `Lenovo IdeaPad Slim 5 14` |
| Warranty | `2 Tahun Resmi Lenovo` |
| Weight (kg) | `1.4` |
| Description | Ultrabook 14 inci dengan Core i5-1335U, bodi aluminium 1,4 kg, cocok untuk kuliah dan kerja mobile. |

Specifications:

```
Prosesor & Grafis

- Prosesor: Intel Core i5-1335U (10 core / 12 thread)
- Grafis: Intel Iris Xe Graphics

Memori & Penyimpanan

- RAM: 16 GB LPDDR5
- Penyimpanan: SSD 512 GB NVMe

Layar

- Ukuran: 14 inci IPS, 1920 x 1200
```

**Hasil yang diharapkan**

- Muncul toast `Product created successfully!`, halaman balik ke Manage Products.
- Ketiga produk tampil di tabel dengan **Stock 0** dan **harga Rp 0**.
- Produk **belum** muncul di katalog publik dengan harga wajar — normal, harga baru terisi di SKN-04.

**Sering gagal karena**

- Tombol Create Product mati → gambar belum ditambahkan (minimal 1, maksimal 5).
- Error `Unique constraint failed on sku` → SKU sudah dipakai. Ganti SKU-nya, jangan asal ulang.

---

## SKN-02 — Edit Produk

**Menu:** Admin → Manage Products → klik baris `ASUS-TUF-A15-DEMO` → **Edit**

Ubah hanya 3 kolom ini:

| Kolom | Dari | Menjadi |
|---|---|---|
| Product Name | `Asus TUF Gaming A15 FA506NF` | `Asus TUF Gaming A15 FA506NF (2024)` |
| Warranty | `2 Tahun Resmi Asus` | `2 Tahun Resmi Asus + 1 Tahun Toko` |
| Weight (kg) | `2.3` | `2.35` |

**Hasil yang diharapkan**

- Toast sukses, nama di tabel berubah jadi `... (2024)`.
- Berat tersimpan `2350` gram (form mengalikan input kg dengan 1000).
- SKU, brand, kondisi, dan gambar **tidak berubah**.
- Harga tetap Rp 0 — endpoint update memang membuang field harga, harga hanya
  boleh berubah lewat Barang Masuk.

---

## SKN-03 — Hapus Produk yang Belum Pernah Bertransaksi (hard delete)

**Menu:** Admin → Manage Products → baris `LEN-IP-S5-DEMO` → **Delete** → konfirmasi

Produk C sengaja tidak dimasukkan ke nota mana pun, jadi stoknya 0 dan belum
pernah masuk pesanan.

**Hasil yang diharapkan**

- Produk hilang dari tabel Manage Products.
- Barisnya benar-benar terhapus dari tabel `products` (hard delete), karena
  stok 0 dan tidak punya order item.

Verifikasi opsional:

```sql
SELECT * FROM products WHERE sku = 'LEN-IP-S5-DEMO';  -- harus 0 baris
```

---

## SKN-04 — Barang Masuk, Qty Cocok

**Menu:** Admin → Inbound → **Add Invoice**

1. **Receipt (PNG/PDF)** → Upload Receipt → pilih
   `uploads/skenario/NOTA-SKENARIO-01.pdf`. Tunggu toast `Receipt uploaded successfully`.
2. Kolom pencarian → ketik `ASUS-TUF-A15-DEMO` → klik hasilnya. Ulangi untuk `HP-VICT-16-DEMO`.
3. Isi tabel item persis seperti isi nota:

| Item | Modal (IDR) | Base Sell (IDR) | Inbound Qty |
|---|---|---|---|
| Asus TUF Gaming A15 FA506NF (2024) | `11500000` | `13200000` | `5` |
| HP Victus 16 fb0121AX | `13000000` | `14900000` | `3` |

4. **Total Qty on Receipt** → `8` (angka ini tertulis di nota).
5. Note (opsional) → `Pembelian unit demo batch pertama`.
6. Klik **SAVE Inbound Items**.

**Hasil yang diharapkan**

- Badge validasi hijau **Quantity Matched** (5 + 3 = 8).
- Toast `Inbound Items saved successfully`, transaksi baru muncul di
  Incoming Goods Report dengan badge `8 Pcs`, tanpa badge Mismatch.
- Balik ke Manage Products: TUF A15 stok **5** harga **Rp 13.200.000**,
  Victus 16 stok **3** harga **Rp 14.900.000**.
- Kedua produk sekarang tampil normal di katalog publik dan bisa dibeli.

**Sering gagal karena**

- Tombol SAVE mati → nota belum ter-upload, Total Qty on Receipt masih 0,
  atau belum ada item yang dipilih.
- Produk tidak ketemu di pencarian → produknya belum dibuat di SKN-01, atau
  sudah terlanjur dihapus.

---

## SKN-05 — Barang Masuk, Qty Tidak Cocok (validasi catatan)

**Menu:** Admin → Inbound → **Add Invoice**

1. Upload `uploads/skenario/NOTA-SKENARIO-02.pdf`.
2. Tambahkan `ASUS-TUF-A15-DEMO`: Modal `11500000`, Base Sell `13200000`, Qty `2`.
3. **Total Qty on Receipt** → `3` (nota menulis 3 unit, yang diterima cuma 2).
4. Perhatikan badge berubah jadi kuning **Quantity Mismatched** dan kolom Note
   jadi wajib. Isi: `Tertulis 3 unit, 1 unit ditolak karena dus penyok`.
5. Klik **SAVE Inbound Items**.

**Hasil yang diharapkan**

- Sebelum Note diisi, tombol SAVE tetap mati — ini yang diuji.
- Setelah Note diisi, transaksi tersimpan dan muncul di daftar dengan badge
  `2 Pcs` + badge oranye **Mismatch**.
- Stok TUF A15 naik dari 5 jadi **7** (bertambah qty yang benar-benar diinput,
  bukan angka yang tertulis di nota).

---

## SKN-06 — Hapus Produk yang Sudah Punya Stok (soft delete)

**Menu:** Admin → Manage Products → baris `ASUS-TUF-A15-DEMO` → **Delete** → konfirmasi

Bedanya dengan SKN-03: produk ini sekarang punya stok 7 dari dua nota.

**Hasil yang diharapkan**

- Produk hilang dari Manage Products dan dari katalog publik.
- Tapi barisnya **masih ada** di database, hanya diberi tanggal di `deleted_at`
  (soft delete), supaya riwayat barang masuk dan laporan stok tidak rusak.
- Transaksi barang masuk di SKN-04 & SKN-05 tetap utuh dan notanya masih bisa dibuka.

Verifikasi opsional:

```sql
SELECT sku, deleted_at FROM products WHERE sku = 'ASUS-TUF-A15-DEMO';
-- harus 1 baris, deleted_at TERISI
```

---

## Ringkasan Hasil Akhir

| SKU | Dibuat | Diedit | Stok akhir | Harga jual | Status akhir |
|---|---|---|---|---|---|
| `ASUS-TUF-A15-DEMO` | SKN-01 | SKN-02 | 7 | Rp 13.200.000 | soft delete (SKN-06) |
| `HP-VICT-16-DEMO` | SKN-01 | — | 3 | Rp 14.900.000 | aktif |
| `LEN-IP-S5-DEMO` | SKN-01 | — | 0 | Rp 0 | hard delete (SKN-03) |

Total 2 transaksi barang masuk: 8 pcs (cocok) dan 2 pcs (mismatch, ada catatan).

## Membersihkan Data Skenario

```sql
DELETE FROM inbound_items  WHERE product_id IN (SELECT product_id FROM products WHERE sku LIKE '%-DEMO');
DELETE FROM inbound_transactions WHERE inbound_transaction_id NOT IN (SELECT inbound_transaction_id FROM inbound_items);
DELETE FROM monitor_stock  WHERE product_id IN (SELECT product_id FROM products WHERE sku LIKE '%-DEMO');
DELETE FROM products WHERE sku LIKE '%-DEMO';
```
