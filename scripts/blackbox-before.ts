/**
 * Membuktikan kelima defect ADA pada kondisi pra-perbaikan.
 * Dijalankan saat src/utils/validation.ts diganti versi permisif (guard menjadi no-op).
 * Setiap baris yang berbunyi "DEFECT TERBUKTI" berarti sistem menerima input yang seharusnya ditolak.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const BASE = `http://localhost:${process.env.PORT || 5000}/api/v1`;
const prisma = new PrismaClient();

async function api(method: string, path: string, body?: any, token?: string) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json: any = await res.json().catch(() => ({}));
  return { status: res.status, message: json?.message ?? "", data: json?.data };
}

const rows: { d: string; skenario: string; harus: string; nyata: string; defect: boolean }[] = [];
function rec(d: string, skenario: string, harus: string, r: { status: number; message: string }, tolakStatus = 400) {
  const defect = r.status !== tolakStatus; // tidak ditolak = defect terbukti
  rows.push({ d, skenario, harus, nyata: `HTTP ${r.status} — "${r.message}"`, defect });
  console.log(`${defect ? "DEFECT TERBUKTI" : "sudah ditolak   "}  ${d}  HTTP ${r.status} "${r.message}"`);
}

const ADDR = { province: "Banten", city: "Tangerang", district: "Cipondoh", street: "Jl. Merdeka No. 10", postalCode: "15147" };

(async () => {
  const rog = (await prisma.product.findUnique({ where: { sku: "ASU-ROG-G16-01" } }))!;
  await prisma.monitorStock.update({ where: { productId: rog.id }, data: { currentStock: 10 } });

  const cust = await api("POST", "/auth/login", { email: "customer@emobo.com", password: "password123" });
  const admin = await api("POST", "/auth/login", { email: "admin@emobo.com", password: "password123" });
  const custToken = cust.data?.access_token;
  const adminToken = admin.data?.access_token;

  // D-02: format email tidak valid
  rec("D-02 (EP)", "Register dengan email 'budi@mail'", "Ditolak (format tidak valid)",
    await api("POST", "/auth/register", { name: "B", email: `budi${Date.now()}@mail`, password: "password123" }));

  // D-03: kata sandi < 6 karakter
  rec("D-03 (BVA)", "Register dengan kata sandi 5 karakter", "Ditolak (di bawah batas minimum)",
    await api("POST", "/auth/register", { name: "B", email: `pw${Date.now()}@gmail.com`, password: "12345" }));

  // siapkan pesanan COMPLETED untuk uji rating
  const ord = await api("POST", "/orders", {
    items: [{ productId: rog.id, qty: 1 }], shippingAddr: ADDR, phone: "08123456789",
    shippingCost: 20000, shippingService: "JNE REG", estimatedDays: 3,
  }, custToken);
  const orderId = ord.data?.id;

  // D-04: status di luar enum
  rec("D-04 (ST)", "Ubah status pesanan menjadi 'DELIVERED'", "Ditolak (bukan anggota enum)",
    await api("PUT", `/orders/${orderId}/status`, { status: "DELIVERED" }, adminToken), 400);

  // D-05: SHIPPED tanpa nomor resi
  rec("D-05 (ST)", "Ubah status menjadi SHIPPED tanpa nomor resi", "Ditolak (nomor resi wajib)",
    await api("PUT", `/orders/${orderId}/status`, { status: "SHIPPED" }, adminToken), 400);

  // jadikan COMPLETED agar rating dapat diuji
  await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });

  // D-01: rating di luar rentang 1-5
  rec("D-01 (BVA)", "Kirim ulasan dengan rating 6", "Ditolak (di luar rentang 1-5)",
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 6 }, custToken));

  rec("D-01 (BVA)", "Kirim ulasan dengan rating 0", "Ditolak (di luar rentang 1-5)",
    await api("POST", "/reviews", { orderId, productId: rog.id, rating: 0 }, custToken));

  // bukti tersimpan di basis data
  const saved = await prisma.review.findMany({ where: { orderId }, select: { rating: true } });
  console.log(`\nRating yang benar-benar tersimpan di basis data: [${saved.map((s) => s.rating).join(", ")}]`);

  const n = rows.filter((r) => r.defect).length;
  console.log(`\n=== ${n}/${rows.length} defect terbukti pada kondisi pra-perbaikan ===\n`);
  console.log("| Defect | Skenario | Seharusnya | Hasil Pra-Perbaikan | Kesimpulan |");
  console.log("|--------|----------|------------|---------------------|------------|");
  for (const r of rows) {
    console.log(`| ${r.d} | ${r.skenario} | ${r.harus} | ${r.nyata} | ${r.defect ? "Tidak Sesuai" : "Sesuai"} |`);
  }

  await prisma.$disconnect();
})();
