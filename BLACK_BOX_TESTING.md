# Black Box Testing Report

## Emobo E-Commerce Platform

Dokumen ini berisi laporan pengujian *black box* terhadap Arsitektur Perangkat Lunak Sistem E-Commerce Emobo. Pengujian dilakukan tanpa melihat struktur kode internal: setiap kasus uji dirancang dari spesifikasi fungsional, dieksekusi, lalu hasil aktual dibandingkan dengan hasil yang diharapkan.

---

## 1. Ruang Lingkup & Metode

### 1.1 Level Pengujian

Pengujian dijalankan pada dua level, karena sebagian aturan bisnis hanya dapat diamati pada salah satunya:

| Level | Cara uji | Alasan |
|-------|----------|--------|
| **UI** | Tester berperan sebagai pengguna melalui peramban | Memverifikasi alur bisnis dan umpan balik antarmuka |
| **API** | Permintaan HTTP langsung ke endpoint (Postman / `curl`) | Sebagian nilai uji **tidak dapat diinput dari UI**. Contoh: rating `0` dan `6` tidak tersedia pada *star picker* yang hanya menampilkan 1–5. Validasi sisi server hanya dapat dibuktikan dengan memanggil endpoint secara langsung. |

Base URL API: `/api/v1`

### 1.2 Teknik Pengujian

| Kode | Teknik | Penerapan |
|------|--------|-----------|
| **EP** | *Equivalence Partitioning* | Membagi domain input menjadi partisi valid dan invalid, lalu menguji satu perwakilan tiap partisi. |
| **BVA** | *Boundary Value Analysis* | Menguji tepat di batas dan satu langkah di luar batas. |
| **ST** | *State Transition* | Menguji perpindahan status pesanan yang sah dan yang tidak sah. |
| **NEG** | *Negative Testing* | Menguji input atau aksi yang seharusnya ditolak sistem. |
| **FUNC** | *Functional Testing* | Verifikasi alur normal (*happy path*). |

### 1.3 Lingkungan Pengujian

| Komponen | Keterangan |
|----------|------------|
| Backend | Express 5 + Prisma 5, PostgreSQL |
| Frontend | Next.js |
| Data uji | `npx prisma db seed` |
| Payment Gateway | Midtrans (Sandbox) / Flip (Sandbox) |

> **Peringatan.** `prisma db seed` menghapus seluruh isi basis data terlebih dahulu. Jalankan hanya pada basis data pengujian.

### 1.4 Data Uji

| Peran | Kredensial | Dipakai untuk |
|-------|-----------|---------------|
| Admin | `admin@emobo.com` / `password123` | Ubah status pesanan, input nomor resi, catat barang masuk |
| Customer (terverifikasi) | `customer@emobo.com` / `password123` | Login, checkout, ulasan, konfirmasi terima |
| Email belum terdaftar | `daffa.fathan9+tc01@gmail.com` | Pendaftaran akun baru |
| Email sudah terdaftar | `customer@emobo.com` | Pendaftaran dengan email duplikat |

**Produk uji:**

| Produk | SKU | Stok |
|--------|-----|------|
| ASUS Zenbook Duo 14 | `ASU-ZEN-DUO14-01` | 5 |
| Acer Aspire 3 (Display Unit) | `ACR-ASP3-DU-01` | 0 |

**Catatan penting.** Pendaftaran dan login **tidak dapat dirantai** menjadi satu skenario. Akun yang baru mendaftar berstatus belum terverifikasi, sehingga login ditolak dengan pesan `"Email not verified, please check your email"` sampai tautan verifikasi pada surel diklik. Karena itu TC-MP-01 dan TC-MP-07 berdiri sendiri.

---

## 2. Manajemen Pelanggan

**Tujuan:** Memverifikasi pendaftaran, autentikasi, dan penolakan input tidak valid.

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-MP-01 | FUNC | UI | Mendaftar dengan data valid | `nama: Budi`, `email: daffa.fathan9+tc01@gmail.com`, `password: password123` | Pendaftaran berhasil, muncul instruksi cek surel. Akun belum dapat dipakai login sebelum verifikasi. | | |
| TC-MP-02 | EP | API | Mendaftar dengan email tanpa `@` | `email: daffafathan9.gmail.com`, `password: password123` | Ditolak, pesan `"Invalid email format"` | | |
| TC-MP-03 | EP | API | Mendaftar dengan email tanpa TLD | `email: daffa@mail`, `password: password123` | Ditolak, pesan `"Invalid email format"` | | |
| TC-MP-04 | BVA | API | Kata sandi satu karakter di bawah batas minimum | `email: daffa.fathan9+tc02@gmail.com`, `password: 12345` | Ditolak, pesan `"Password must be at least 6 characters"` | | |
| TC-MP-05 | BVA | API | Kata sandi tepat pada batas minimum | `email: daffa.fathan9+tc03@gmail.com`, `password: 123456` | Diterima, akun dibuat | | |
| TC-MP-06 | EP | UI | Mendaftar dengan email yang sudah terdaftar | `email: customer@emobo.com` | Ditolak, pesan `"Email already registered"`, akun tidak diduplikasi | | |
| TC-MP-07 | FUNC | UI | Login dengan kredensial valid | `customer@emobo.com` / `password123` | Login berhasil, pengguna diarahkan ke dashboard | | |
| TC-MP-08 | NEG | UI | Login dengan kata sandi salah | `customer@emobo.com` / `salahpassword` | Ditolak, pesan `"Invalid credentials"` | | |
| TC-MP-09 | NEG | UI | Login dengan akun yang belum verifikasi surel | Akun hasil TC-MP-01 | Ditolak, pesan `"Email not verified, please check your email"` | | |

**Partisi ekivalensi alamat surel:**

| Partisi | Perwakilan | Ekspektasi |
|---------|-----------|-----------|
| Valid & belum terdaftar | `daffa.fathan9+tc01@gmail.com` | Diterima |
| Invalid — tanpa `@` | `daffafathan9.gmail.com` | Ditolak |
| Invalid — tanpa TLD | `daffa@mail` | Ditolak |
| Valid & sudah terdaftar | `customer@emobo.com` | Ditolak (duplikat) |

---

## 3. Data Master & Laporan

### 3.1 Manajemen Profil

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-DM-01 | FUNC | UI | Melengkapi profil pengguna | `nama: Budi Santoso`, `nomor HP: 08123456789`, `alamat: Jl. Merdeka No. 10`, `catatan alamat: Pagar hijau` | Profil tersimpan, data terbaru langsung tampil pada halaman profil | | |

### 3.2 Manajemen Katalog Produk

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-DM-02 | FUNC | UI | Admin menambah produk | Nama, deskripsi, merek, kondisi, harga, stok, gambar | Produk tersimpan dan muncul pada katalog konsumen | | |
| TC-DM-03 | FUNC | UI | Konsumen mencari produk | Kata kunci `Zenbook` | Hanya produk yang cocok dengan kata kunci yang ditampilkan | | |

### 3.3 Pusat Notifikasi

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-DM-04 | FUNC | UI | Sistem mengirim notifikasi perubahan status pesanan | Admin mengubah status pesanan menjadi `PROCESSING` | Notifikasi baru muncul pada pusat notifikasi milik konsumen | | |

### 3.4 Laporan & Analitik

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-DM-05 | FUNC | UI | Membuka halaman Reports & Analytics pertama kali | Navigasi ke halaman | Rentang tanggal terisi otomatis 7 hari terakhir (*Start Date* = hari ini − 7, *End Date* = hari ini) | | |

---

## 4. Pembayaran Gateway (Midtrans & Flip)

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-PG-01 | FUNC | UI | Konsumen menyelesaikan checkout | 1× ASUS Zenbook Duo 14 | Pengguna diarahkan ke halaman pembayaran gateway yang aktif, dan tagihan terbit dengan ID berformat `TR<DDMMYYYY>-<NNNN>` (contoh: `TR09072026-0001`) | | |
| TC-PG-02 | FUNC | UI | Redirect setelah pembayaran sukses | Klik "Selesaikan Pembayaran" pada gateway | Konsumen otomatis kembali ke halaman detail pesanannya | | |
| TC-PG-03 | FUNC | API | Sistem menerima *webhook* dari gateway | Payload webhook berstatus `SUCCESS` | Status pembayaran berubah menjadi Lunas dan pesanan lanjut diproses | | |

---

## 5. Transaksi Penjualan & Order Management

**Tujuan:** Memverifikasi kalkulasi pesanan, format ID pesanan, dan transisi status.

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-TP-01 | FUNC | UI | Riwayat pesanan menampilkan total harga | Pesanan berisi harga barang + ongkos kirim | Total harga tampil terformat sebagai rupiah, tanpa `RpNaN`. ID pesanan berformat `TR<DDMMYYYY>-<NNNN>`. *(Regresi: kasus ini pernah gagal dan menampilkan `RpNaN`, telah diperbaiki.)* | | |
| TC-TP-02 | ST | UI | Admin membuka dropdown status pada daftar pesanan | Pesanan berstatus `PENDING` | Dropdown hanya menawarkan `PENDING` dan `CANCELLED` | | |
| TC-TP-03 | ST | UI | Admin menandai pesanan dikirim **dengan** nomor resi | Pesanan `PROCESSING`, resi `JNE1234567890` | Status berubah menjadi `SHIPPED`, nomor resi tersimpan dan tampil | | |
| TC-TP-04 | ST | UI | Admin menandai pesanan dikirim **tanpa** nomor resi | Pesanan `PROCESSING`, kolom resi kosong | Tombol nonaktif; aksi ditolak dengan pesan `"Tracking Number is required"` | | |
| TC-TP-05 | ST | API | Mengirim status yang tidak ada pada enum | `PUT /orders/:id/status` `{ "status": "DELIVERED" }` | Ditolak, pesan `"Invalid order status: DELIVERED"` | | |
| TC-TP-06 | ST | API | Menetapkan `SHIPPED` tanpa nomor resi | `PUT /orders/:id/status` `{ "status": "SHIPPED" }` | Ditolak, pesan `"Tracking number is required to mark an order as SHIPPED"` | | |
| TC-TP-07 | ST | UI | Konsumen mengonfirmasi pesanan diterima | Pesanan berstatus `SHIPPED` | Status berubah menjadi `COMPLETED` | | |
| TC-TP-08 | ST | API | Konfirmasi terima pada pesanan yang belum dikirim | Pesanan `PROCESSING`, `POST /orders/:id/confirm-received` | Ditolak, pesan `"Order is not in SHIPPED status"` | | |
| TC-TP-09 | ST | API | Membatalkan pesanan yang sudah selesai | Pesanan `COMPLETED`, `PUT /orders/:id/cancel` | Ditolak, pesan `"Cannot cancel order in COMPLETED status"` | | |
| TC-TP-10 | ST | UI | Membatalkan pesanan yang masih `PENDING` | Pesanan `PENDING` | Status berubah `CANCELLED`, stok produk dikembalikan | | |

**Diagram transisi status yang sah:**

```
PENDING ──> PROCESSING ──> SHIPPED ──> COMPLETED
   │                     (wajib nomor resi)
   └──> CANCELLED
```

Status yang dikenali sistem: `PENDING`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`. Nilai lain, termasuk `DELIVERED`, ditolak.

---

## 6. Manajemen Stok

**Tujuan:** Memverifikasi mutasi persediaan (barang masuk dan keluar) serta penegakan batas stok.

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-MS-01 | BVA | UI | Pesan satu unit **di bawah** stok tersedia | Zenbook Duo 14 (stok 5), qty `4` | Checkout berhasil, sisa stok menjadi `1` | | |
| TC-MS-02 | BVA | UI | Pesan **tepat sejumlah** stok tersedia | Zenbook Duo 14 (stok 5), qty `5` | Checkout berhasil, sisa stok menjadi `0` | | |
| TC-MS-03 | BVA | UI | Pesan satu unit **di atas** stok tersedia | Zenbook Duo 14 (stok 5), qty `6` | Checkout ditolak, pesan `"Insufficient stock for product ASUS Zenbook Duo 14"` | | |
| TC-MS-04 | BVA | UI | Pesan produk berstok `0` | Acer Aspire 3 (Display Unit), qty `1` | Label "Out of Stock" tampil, tombol tambah ke keranjang nonaktif | | |
| TC-MS-05 | FUNC | UI | Stok berkurang setelah transaksi sukses | Transaksi penjualan baru | Stok katalog berkurang sesuai kuantitas barang keluar | | |
| TC-MS-06 | FUNC | UI | Admin mencatat barang masuk | Bukti nota, total item pada nota, daftar produk + kuantitas | Ketersediaan barang bertambah sesuai kuantitas, tercatat pada rekapitulasi barang masuk | | |

**Analisis nilai batas stok (stok = 5):**

| Nilai qty | Posisi terhadap batas | Ekspektasi |
|-----------|----------------------|-----------|
| 4 | Batas atas − 1 | Diterima |
| 5 | Tepat batas atas | Diterima |
| 6 | Batas atas + 1 | Ditolak |
| 1 (pada stok 0) | Di luar rentang | Ditolak |

> Keranjang belanja pada sisi peramban mengizinkan kuantitas melebihi stok; penolakan terjadi saat *checkout*. Ini perilaku yang benar — server adalah otoritas tunggal atas stok.

---

## 7. Ulasan Produk

**Tujuan:** Memastikan hanya pembeli sah pada pesanan selesai yang dapat memberi ulasan, dan rating berada dalam rentang 1–5.

| ID | Teknik | Level | Skenario | Input | Hasil Yang Diharapkan | Hasil Pengujian | Status |
|----|--------|-------|----------|-------|-----------------------|-----------------|--------|
| TC-UP-01 | BVA | API | Rating satu tingkat **di bawah** batas bawah | `rating: 0` pada pesanan `COMPLETED` | Ditolak, pesan `"Rating must be an integer between 1 and 5"` | | |
| TC-UP-02 | BVA | UI | Rating **tepat** pada batas bawah | `rating: 1` | Ulasan tersimpan dan tampil pada halaman detail produk | | |
| TC-UP-03 | BVA | UI | Rating **tepat** pada batas atas | `rating: 5` | Ulasan tersimpan dan tampil pada halaman detail produk | | |
| TC-UP-04 | BVA | API | Rating satu tingkat **di atas** batas atas | `rating: 6` pada pesanan `COMPLETED` | Ditolak, pesan `"Rating must be an integer between 1 and 5"` | | |
| TC-UP-05 | NEG | API | Memberi ulasan pada pesanan milik pengguna lain | `orderId` milik akun lain | Ditolak, pesan `"Invalid order or user"` | | |
| TC-UP-06 | NEG | API | Memberi ulasan pada pesanan yang belum selesai | Pesanan berstatus `SHIPPED` | Ditolak, pesan `"Can only review completed orders"` | | |

**Analisis nilai batas rating (rentang sah 1–5):**

| Nilai | Posisi terhadap batas | Ekspektasi | Level uji |
|-------|----------------------|-----------|-----------|
| 0 | Batas bawah − 1 | Ditolak | API — tidak dapat diinput dari UI |
| 1 | Tepat batas bawah | Diterima | UI |
| 5 | Tepat batas atas | Diterima | UI |
| 6 | Batas atas + 1 | Ditolak | API — tidak dapat diinput dari UI |

> TC-UP-01 dan TC-UP-04 dijalankan pada level API karena *star picker* pada antarmuka hanya menyediakan nilai 1–5. Nilai di luar rentang mustahil diinput dari peramban, sehingga penegakan batas oleh server hanya dapat dibuktikan dengan memanggil endpoint secara langsung.

---

## 8. Temuan Defect & Perbaikan

Enam defect ditemukan selama perancangan dan eksekusi kasus uji. Seluruhnya luput dari pengujian terdahulu karena pengujian sebelumnya hanya menempuh jalur normal melalui antarmuka. Lima di antaranya berakar pada satu pola yang sama: aturan bisnis ternyata **hanya ditegakkan di sisi antarmuka**, sehingga dapat ditembus dengan memanggil endpoint API secara langsung.

| ID | Deskripsi | Ditemukan oleh | Perbaikan | Retest |
|----|-----------|----------------|-----------|--------|
| D-01 | Rating di luar rentang 1–5 (`0`, `6`, bahkan bukan bilangan) diterima dan tersimpan. Pembatasan hanya ada pada *star picker* antarmuka. | BVA (TC-UP-01, TC-UP-04) | Validasi rentang rating pada layanan ulasan | |
| D-02 | Alamat surel dengan format tidak valid diterima saat pendaftaran. | EP (TC-MP-02, TC-MP-03) | Validasi format surel pada pendaftaran | |
| D-03 | Kata sandi kurang dari 6 karakter diterima saat pendaftaran. | BVA (TC-MP-04) | Validasi panjang minimum kata sandi | |
| D-04 | Status pesanan sembarang, termasuk `DELIVERED` yang tidak ada pada enum, diterima dan tersimpan. | ST (TC-TP-05) | Validasi status terhadap daftar status yang sah | |
| D-05 | Status `SHIPPED` dapat ditetapkan tanpa nomor resi melalui API. Kewajiban nomor resi hanya ditegakkan pada antarmuka admin. | ST (TC-TP-06) | Wajibkan nomor resi saat status `SHIPPED` | |
| D-06 | Skrip *seeding* basis data tidak dapat dijalankan sama sekali, sehingga data uji tidak reproducible. | Penyiapan lingkungan uji | Perbaikan skrip *seeding* | |

**Pengujian regresi otomatis.** Nilai batas pada seluruh tabel BVA dan EP di atas dikunci oleh pemeriksaan otomatis, sehingga perbaikan D-01 sampai D-04 tidak dapat mengalami kemunduran tanpa terdeteksi:

```
$ npm test
# tests 4
# pass 4
# fail 0
```

---

## 9. Ringkasan Hasil Pengujian

| Keterangan | Jumlah |
|------------|--------|
| Total kasus uji | 39 |
| Level UI | 26 |
| Level API | 13 |

| Tahap | Pass | Fail |
|-------|------|------|
| Eksekusi awal (sebelum perbaikan) | | |
| Eksekusi ulang (setelah perbaikan) | | |

**Cakupan teknik:**

| Teknik | Jumlah kasus |
|--------|-------------|
| Functional Testing (FUNC) | 13 |
| Boundary Value Analysis (BVA) | 10 |
| State Transition (ST) | 9 |
| Negative Testing (NEG) | 4 |
| Equivalence Partitioning (EP) | 3 |
| **Total** | **39** |

---

## 10. Kesimpulan

*(Diisi setelah eksekusi penuh.)*

---

## 11. Saran Pengembangan

1. **Lapisan validasi permintaan terpusat.** Validasi saat ini berupa penjagaan per-endpoint. Bila jumlah endpoint bertambah, disarankan menerapkan *middleware* validasi skema agar setiap endpoint tervalidasi seragam dan tidak ada yang terlewat.
2. **Pengujian otomatis pada level API.** Kasus uji level API pada dokumen ini masih dijalankan secara manual. Kasus-kasus tersebut layak diangkat menjadi *integration test* agar ikut dijalankan pada setiap perubahan kode.
3. **Aturan bisnis tidak boleh hanya berada di antarmuka.** Lima dari enam defect berakar pada pola yang sama. Setiap aturan bisnis baru sebaiknya divalidasi di sisi server terlebih dahulu, dengan antarmuka berperan sebagai peningkatan pengalaman pengguna, bukan sebagai penjaga.
