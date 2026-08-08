// Cek cepat body email order baru. Jalankan: npx tsx src/utils/email.check.ts
// Tidak menyentuh SMTP — hanya menguji loop item, perkalian qty, dan format Rupiah.
import assert from "node:assert";
import { buildNewOrderHtml } from "./email";

// Intl id-ID memisah "Rp" dan angka dengan U+00A0 (bukan spasi biasa). Itu memang
// diinginkan di email HTML supaya tidak wrap, jadi yang dinormalisasi assertion-nya.
const raw = buildNewOrderHtml({
  orderId: "TR08082026-0001",
  customerName: "Budi",
  customerEmail: "budi@mail.com",
  total: 25_001_000,
  items: [
    { name: "Macbook Air M2", qty: 2, unitPrice: 12_000_000 },
    { name: "Mouse Logitech", qty: 1, unitPrice: 1_000_000 },
  ],
});

const html = raw.replace(/ /g, " ");

assert(html.includes("TR08082026-0001"), "order id hilang");
assert(html.includes("Budi") && html.includes("budi@mail.com"), "identitas pembeli hilang");
assert(html.includes("Macbook Air M2") && html.includes("Mouse Logitech"), "item hilang");
assert(html.includes("Rp 24.000.000"), "subtotal qty>1 salah dihitung");
assert(html.includes("Rp 1.000.000"), "subtotal qty=1 salah dihitung");
assert(html.includes("Rp 25.001.000"), "total salah diformat");

console.log("ok");
