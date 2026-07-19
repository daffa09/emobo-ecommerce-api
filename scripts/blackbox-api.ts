/**
 * Eksekusi kasus uji black box level API.
 * Prasyarat: `npx prisma db seed` sudah dijalankan, dan server hidup di PORT.
 * Jalankan: npx tsx scripts/blackbox-api.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const BASE = `http://localhost:${process.env.PORT || 5000}/api/v1`;
const prisma = new PrismaClient();

type Res = { status: number; message: string; data: any };

async function api(method: string, path: string, body?: any, token?: string): Promise<Res> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json: any = await res.json().catch(() => ({}));
  return { status: res.status, message: json?.message ?? "", data: json?.data };
}

const results: { id: string; skenario: string; expected: string; actual: string; ok: boolean }[] = [];

function check(id: string, skenario: string, expected: string, r: Res, wantStatus: number, wantMsg?: string) {
  const ok = r.status === wantStatus && (wantMsg === undefined || r.message.includes(wantMsg));
  results.push({ id, skenario, expected, actual: `HTTP ${r.status} — "${r.message}"`, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  HTTP ${r.status} "${r.message}"`);
  return ok;
}

async function stockOf(sku: string) {
  const p = await prisma.product.findUnique({ where: { sku } });
  const ms = await prisma.monitorStock.findUnique({ where: { productId: p!.id } });
  return { id: p!.id, name: p!.name, stock: ms!.currentStock };
}

async function resetStock(sku: string, n: number) {
  const p = await prisma.product.findUnique({ where: { sku } });
  await prisma.monitorStock.update({ where: { productId: p!.id }, data: { currentStock: n } });
}

const ADDR = { province: "Banten", city: "Tangerang", district: "Cipondoh", street: "Jl. Merdeka No. 10", postalCode: "15147" };
const newOrder = (productId: string, qty: number) => ({
  items: [{ productId, qty }],
  shippingAddr: ADDR,
  phone: "08123456789",
  shippingCost: 20000,
  shippingService: "JNE REG",
  estimatedDays: 3,
});

(async () => {
  const zen = await stockOf("ASU-ZEN-D14-02");
  const rog = await stockOf("ASU-ROG-G16-01");
  const acer = await stockOf("ACR-ASP3-DU-01");
  console.log(`fixture: ${zen.name} stok=${zen.stock} | ${rog.name} stok=${rog.stock} | ${acer.name} stok=${acer.stock}\n`);

  // ---- Tabel 6.3 Registrasi ----
  const unique = `bb${Date.now()}@gmail.com`;
  check("T6.3-3 (EP)", "Email tanpa simbol @", 'Ditolak, "Invalid email format"',
    await api("POST", "/auth/register", { name: "Budi", email: "budi.testing.gmail.com", password: "password123" }), 400, "Invalid email format");

  check("T6.3-4 (EP)", "Email tanpa domain tingkat atas", 'Ditolak, "Invalid email format"',
    await api("POST", "/auth/register", { name: "Budi", email: "budi@mail", password: "password123" }), 400, "Invalid email format");

  check("T6.3-5 (BVA)", "Kata sandi 5 karakter (batas-1)", 'Ditolak, "Password must be at least 6 characters"',
    await api("POST", "/auth/register", { name: "Budi", email: `x${unique}`, password: "12345" }), 400, "Password must be at least 6 characters");

  check("T6.3-6 (BVA)", "Kata sandi 6 karakter (tepat batas)", "Diterima, akun dibuat",
    await api("POST", "/auth/register", { name: "Budi", email: unique, password: "123456" }), 201);

  check("T6.3-2 (EP)", "Email sudah terdaftar", 'Ditolak, "Email already registered"',
    await api("POST", "/auth/register", { name: "Dup", email: "customer@emobo.com", password: "password123" }), 400, "Email already registered");

  // ---- Tabel 6.4 Autentikasi ----
  const loginCust = await api("POST", "/auth/login", { email: "customer@emobo.com", password: "password123" });
  check("T6.4-1 (FUNC)", "Login pelanggan valid", "Autentikasi berhasil", loginCust, 200);
  const custToken = loginCust.data?.access_token;

  const loginAdmin = await api("POST", "/auth/login", { email: "admin@emobo.com", password: "password123" });
  check("T6.4-2 (FUNC)", "Login admin valid", "Autentikasi berhasil", loginAdmin, 200);
  const adminToken = loginAdmin.data?.access_token;

  check("T6.4-3 (NEG)", "Kata sandi salah", 'Ditolak, "Invalid credentials"',
    await api("POST", "/auth/login", { email: "customer@emobo.com", password: "salahpassword" }), 400, "Invalid credentials");

  check("T6.4-4 (NEG)", "Akun belum verifikasi surel", 'Ditolak, "Email not verified"',
    await api("POST", "/auth/login", { email: unique, password: "123456" }), 403, "Email not verified");

  // ---- Tabel 6.6 BVA stok (Zenbook, stok 5) ----
  await resetStock("ASU-ZEN-D14-02", 5);
  const s4 = await api("POST", "/orders", newOrder(zen.id, 4), custToken);
  const after4 = (await stockOf("ASU-ZEN-D14-02")).stock;
  check("T6.6-1 (BVA)", "qty 4 (batas-1) pada stok 5", "Checkout berhasil, sisa stok 1",
    { ...s4, message: s4.status === 201 ? `${s4.message}, sisa stok=${after4}` : s4.message }, 201);

  await resetStock("ASU-ZEN-D14-02", 5);
  const s5 = await api("POST", "/orders", newOrder(zen.id, 5), custToken);
  const after5 = (await stockOf("ASU-ZEN-D14-02")).stock;
  check("T6.6-2 (BVA)", "qty 5 (tepat batas) pada stok 5", "Checkout berhasil, sisa stok 0",
    { ...s5, message: s5.status === 201 ? `${s5.message}, sisa stok=${after5}` : s5.message }, 201);

  await resetStock("ASU-ZEN-D14-02", 5);
  check("T6.6-3 (BVA)", "qty 6 (batas+1) pada stok 5", `Ditolak, "Insufficient stock for product ${zen.name}"`,
    await api("POST", "/orders", newOrder(zen.id, 6), custToken), 400, "Insufficient stock");

  check("T6.6-4 (BVA)", "qty 1 pada produk stok 0", `Ditolak, "Insufficient stock for product ${acer.name}"`,
    await api("POST", "/orders", newOrder(acer.id, 1), custToken), 400, "Insufficient stock");

  // ---- Tabel 6.7 Checkout: format ID pesanan ----
  const created = await api("POST", "/orders", newOrder(rog.id, 1), custToken);
  const orderId: string = created.data?.id;
  const idOk = /^TR\d{8}-\d{4}$/.test(orderId || "");
  const totalOk = Number.isFinite(Number(created.data?.total_grand));
  results.push({
    id: "T6.7-1 (FUNC)", skenario: "Checkout menghasilkan ID pesanan berformat TR<DDMMYYYY>-<NNNN>",
    expected: "Pesanan dibuat, ID sesuai format", actual: `HTTP ${created.status} — ID pesanan "${orderId}"`, ok: created.status === 201 && idOk,
  });
  console.log(`${created.status === 201 && idOk ? "PASS" : "FAIL"}  T6.7-1  id=${orderId}`);
  results.push({
    id: "T6.7-2 (FUNC)", skenario: "Total pesanan terhitung benar, tanpa RpNaN",
    expected: "Total berupa angka valid", actual: `total_grand = ${created.data?.total_grand} (bukan NaN)`, ok: totalOk,
  });
  console.log(`${totalOk ? "PASS" : "FAIL"}  T6.7-2  total_grand=${created.data?.total_grand}`);

  // ---- Tabel 6.8 State transition ----
  check("T6.8-4 (ST)", "Status DELIVERED (tidak ada pada enum)", 'Ditolak, "Invalid order status: DELIVERED"',
    await api("PUT", `/orders/${orderId}/status`, { status: "DELIVERED" }, adminToken), 400, "Invalid order status: DELIVERED");

  check("T6.8-3 (ST)", "SHIPPED tanpa nomor resi", 'Ditolak, "Tracking number is required..."',
    await api("PUT", `/orders/${orderId}/status`, { status: "SHIPPED" }, adminToken), 400, "Tracking number is required");

  check("T6.8-6 (ST)", "Konfirmasi terima saat pesanan belum dikirim", 'Ditolak, "Order is not in SHIPPED status"',
    await api("POST", `/orders/${orderId}/confirm-received`, {}, custToken), 400, "Order is not in SHIPPED status");

  check("T6.8-x (ST)", "Admin mengubah status ke PROCESSING", "Diterima",
    await api("PUT", `/orders/${orderId}/status`, { status: "PROCESSING" }, adminToken), 200);

  check("T6.8-2 (ST)", "SHIPPED disertai nomor resi JNE1234567890", "Diterima, resi tersimpan",
    await api("PUT", `/orders/${orderId}/status`, { status: "SHIPPED", trackingNo: "JNE1234567890" }, adminToken), 200);

  check("T6.8-5 (ST)", "Konsumen mengonfirmasi pesanan diterima", "Status menjadi COMPLETED",
    await api("POST", `/orders/${orderId}/confirm-received`, {}, custToken), 200);

  check("T6.8-7 (ST)", "Membatalkan pesanan berstatus COMPLETED", 'Ditolak, "Cannot cancel order in COMPLETED status"',
    await api("PUT", `/orders/${orderId}/cancel`, {}, custToken), 400, "Cannot cancel order in COMPLETED status");

  // batal pesanan PENDING -> stok kembali
  await resetStock("ASU-ROG-G16-01", 10);
  const pend = await api("POST", "/orders", newOrder(rog.id, 2), custToken);
  const afterOrder = (await stockOf("ASU-ROG-G16-01")).stock;
  const cancelRes = await api("PUT", `/orders/${pend.data?.id}/cancel`, {}, custToken);
  const afterCancel = (await stockOf("ASU-ROG-G16-01")).stock;
  results.push({
    id: "T6.8-8 (ST)", skenario: "Membatalkan pesanan PENDING, stok dikembalikan",
    expected: "Status CANCELLED, stok kembali seperti semula",
    actual: `HTTP ${cancelRes.status} — stok 10 → ${afterOrder} (setelah pesan) → ${afterCancel} (setelah batal)`,
    ok: cancelRes.status === 200 && afterCancel === 10,
  });
  console.log(`${cancelRes.status === 200 && afterCancel === 10 ? "PASS" : "FAIL"}  T6.8-8  stok ${afterOrder}->${afterCancel}`);

  // ---- Tabel 6.9 Review BVA (orderId sudah COMPLETED) ----
  check("T6.9-1 (BVA)", "Rating 0 (batas bawah - 1)", 'Ditolak, "Rating must be an integer between 1 and 5"',
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 0, comment: "uji batas" }, custToken), 400, "Rating must be an integer between 1 and 5");

  check("T6.9-4 (BVA)", "Rating 6 (batas atas + 1)", 'Ditolak, "Rating must be an integer between 1 and 5"',
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 6, comment: "uji batas" }, custToken), 400, "Rating must be an integer between 1 and 5");

  check("T6.9-2 (BVA)", "Rating 1 (tepat batas bawah)", "Ulasan tersimpan",
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 1, comment: "batas bawah" }, custToken), 201);

  check("T6.9-3 (BVA)", "Rating 5 (tepat batas atas)", "Ulasan tersimpan",
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 5, comment: "batas atas" }, custToken), 201);

  check("T6.9-5 (NEG)", "Ulasan pada pesanan yang belum selesai", 'Ditolak, "Can only review completed orders"',
    await api("POST", "/reviews", { orderId: pend.data?.id, productId: rog.id, rating: 5 }, custToken), 400, "Can only review completed orders");

  check("T6.9-6 (NEG)", "Ulasan pada pesanan milik pengguna lain", 'Ditolak, "Invalid order or user"',
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 5 }, adminToken), 400, "Invalid order or user");

  // ---- Ringkasan ----
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n=== RINGKASAN: ${pass}/${results.length} sesuai ===\n`);
  console.log("| Kasus | Skenario | Hasil yang Diharapkan | Hasil Pengujian | Status |");
  console.log("|-------|----------|-----------------------|-----------------|--------|");
  for (const r of results) {
    console.log(`| ${r.id} | ${r.skenario} | ${r.expected} | ${r.actual} | ${r.ok ? "Sesuai" : "TIDAK SESUAI"} |`);
  }

  await prisma.$disconnect();
  process.exit(pass === results.length ? 0 : 1);
})();
