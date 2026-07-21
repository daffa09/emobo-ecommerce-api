# Skenario Uji Manual — Produk & Barang Masuk

Skenario input satu per satu lewat halaman Admin, fokus pada **satu produk**:
Asus TUF Gaming A15. Urutannya berantai — produk yang dipakai di skenario
Barang Masuk adalah produk yang dibuat di skenario pertama, dan skenario hapus
butuh stok yang sudah masuk lewat nota.

**Jalankan berurutan dari SKN-01 sampai SKN-04. Jangan diacak.**

---

## Persiapan

| Butuh | Di mana |
|---|---|
| Login admin | `admin@emobo.com` / `password123` |
| Gambar produk (1 file PNG) | `uploads/skenario/gambar/ASUS-TUF-A15.png` |
| Nota barang masuk (1 file PDF) | `uploads/skenario/NOTA-SKENARIO.pdf` |

Kalau nota belum ada, buat dulu:

```bash
npx tsx scripts/generate-nota-skenario.ts
```

Cek juga master data sudah terisi — brand **Asus** dan kondisi **New** harus
sudah ada di menu Brands & Conditions, karena dipilih lewat dropdown saat input
produk.

### Catatan penting soal harga

Form Tambah/Edit Produk **tidak punya kolom harga**. Harga modal dan harga
jual di sistem ini hanya bisa diisi lewat **Barang Masuk** (SKN-03). Jadi
produk yang baru dibuat wajar kalau harganya masih Rp 0 dan stoknya 0 —
itu bukan bug, memang alurnya begitu.

---

## SKN-01 — Tambah Produk

**Menu:** Admin → Manage Products → **Add New Product**

| Kolom | Isi |
|---|---|
| Product Images | `uploads/skenario/gambar/ASUS-TUF-A15.png` |
| SKU | `ASUS-TUF-A15` |
| Brand | Asus |
| Condition | New |
| Product Name | `Asus TUF Gaming A15 FA506NF` |
| Warranty | `2 Tahun Resmi Asus` |
| Weight (kg) | `2.3` |
| Description | Laptop gaming entry level dengan Ryzen 5 7535HS dan RTX 2050, sasis lolos uji militer MIL-STD-810H. |

Kolom **Specifications** itu editor teks (TipTap), jadi diketik langsung —
bukan tempel HTML. Klik **Fill Template** buat dapat kerangkanya, lalu ikuti
susunan di bawah: baris **Judul** pakai format Heading, baris di bawahnya
pakai Bullet List.

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

**Hasil yang diharapkan**

- Muncul toast `Product created successfully!`, halaman balik ke Manage Products.
- Produk tampil di tabel dengan **Stock 0** dan **harga Rp 0**.
- Produk **belum** muncul di katalog publik dengan harga wajar — normal, harga baru terisi di SKN-03.

**Sering gagal karena**

- Tombol Create Product mati → gambar belum ditambahkan (minimal 1, maksimal 5).
- Error `Unique constraint failed on sku` → SKU sudah dipakai. Ganti SKU-nya, jangan asal ulang.

---

## SKN-02 — Edit Produk

**Menu:** Admin → Manage Products → klik baris `ASUS-TUF-A15` → **Edit**

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

## SKN-03 — Barang Masuk, Qty Cocok

**Menu:** Admin → Inbound → **Add Invoice**

1. **Receipt (PNG/PDF)** → Upload Receipt → pilih
   `uploads/skenario/NOTA-SKENARIO.pdf`. Tunggu toast `Receipt uploaded successfully`.
2. Kolom pencarian → ketik `ASUS-TUF-A15` → klik hasilnya.
3. Isi tabel item persis seperti isi nota:

| Item | Modal (IDR) | Base Sell (IDR) | Inbound Qty |
|---|---|---|---|
| Asus TUF Gaming A15 FA506NF (2024) | `11500000` | `13200000` | `5` |

4. **Total Qty on Receipt** → `5` (angka ini tertulis di nota).
5. Note (opsional) → `Pembelian unit demo`.
6. Klik **SAVE Inbound Items**.

**Hasil yang diharapkan**

- Badge validasi hijau **Quantity Matched** (5 = 5).
- Toast `Inbound Items saved successfully`, transaksi baru muncul di
  Incoming Goods Report dengan badge `5 Pcs`, tanpa badge Mismatch.
- Balik ke Manage Products: TUF A15 stok **5** harga **Rp 13.200.000**.
- Produk sekarang tampil normal di katalog publik dan bisa dibeli.

**Sering gagal karena**

- Tombol SAVE mati → nota belum ter-upload, Total Qty on Receipt masih 0,
  atau belum ada item yang dipilih.
- Produk tidak ketemu di pencarian → produknya belum dibuat di SKN-01.

---

## SKN-04 — Hapus Produk yang Sudah Punya Stok (soft delete)

**Menu:** Admin → Manage Products → baris `ASUS-TUF-A15` → **Delete** → konfirmasi

Produk ini sekarang punya stok 5 dari nota.

**Hasil yang diharapkan**

- Produk hilang dari Manage Products dan dari katalog publik.
- Tapi barisnya **masih ada** di database, hanya diberi tanggal di `deleted_at`
  (soft delete), supaya riwayat barang masuk dan laporan stok tidak rusak.
- Transaksi barang masuk di SKN-03 tetap utuh dan notanya masih bisa dibuka.

Verifikasi opsional:

```sql
SELECT sku, deleted_at FROM products WHERE sku = 'ASUS-TUF-A15';
-- harus 1 baris, deleted_at TERISI
```

---

## Ringkasan Hasil Akhir

| SKU | Dibuat | Diedit | Stok akhir | Harga jual | Status akhir |
|---|---|---|---|---|---|
| `ASUS-TUF-A15` | SKN-01 | SKN-02 | 5 | Rp 13.200.000 | soft delete (SKN-04) |

Total 1 transaksi barang masuk: 5 pcs (cocok).

## Membersihkan Data Skenario

```sql
DELETE FROM inbound_items  WHERE product_id IN (SELECT product_id FROM products WHERE sku = 'ASUS-TUF-A15');
DELETE FROM inbound_transactions WHERE inbound_transaction_id NOT IN (SELECT inbound_transaction_id FROM inbound_items);
DELETE FROM monitor_stock  WHERE product_id IN (SELECT product_id FROM products WHERE sku = 'ASUS-TUF-A15');
DELETE FROM products WHERE sku = 'ASUS-TUF-A15';
```
