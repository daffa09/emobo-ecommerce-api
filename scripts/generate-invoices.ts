/**
 * Membuat file PDF untuk data dummy:
 *
 *   1. Nota pembelian supplier  -> uploads/receipts/<nama file dari receipt_url>
 *      Ini satu-satunya dokumen yang dirujuk database (inbound_transactions.receipt_url)
 *      dan dibuka dari halaman Laporan Barang Masuk.
 *
 *   2. Invoice pesanan customer -> uploads/invoices/<order_id>.pdf
 *      Berdiri sendiri; aplikasi merender invoice secara langsung lewat window.print(),
 *      tidak ada kolom database yang menyimpan path-nya.
 *
 * Jalankan setelah dummy_data.sql:  npx tsx scripts/generate-invoices.ts
 */
import path from "path";
import fs from "fs/promises";
import prisma from "../src/prisma";

// pdfmake tidak punya tipe untuk entry point servernya, jadi di-require langsung.
// Font standar PDF (Helvetica) dipakai supaya tidak perlu menyertakan file .ttf.
const pdfmake = require("pdfmake");
pdfmake.addFonts({
  Helvetica: {
    normal: ["Helvetica"],
    bold: ["Helvetica-Bold"],
    italics: ["Helvetica-Oblique"],
    bolditalics: ["Helvetica-BoldOblique"],
  },
});

const UPLOADS = path.join(__dirname, "..", "uploads");

const TOKO = {
  nama: "EMOBO E-COMMERCE",
  slogan: "Solusi Laptop Terbaik & Terpercaya",
  alamat: "Jl. Raya Cibaduyut No. 118, Bojongloa Kidul, Bandung 40235",
  kontak: "Telp 022-5401188  |  admin@emobo.com  |  NPWP 01.234.567.8-424.000",
};

const rupiah = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID", { minimumFractionDigits: 0 });

const tanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const kop = (judul: string, nomor: string, tgl: Date) => [
  {
    columns: [
      [
        { text: TOKO.nama, style: "brand" },
        { text: TOKO.slogan, style: "muted" },
        { text: TOKO.alamat, style: "small", margin: [0, 6, 0, 0] },
        { text: TOKO.kontak, style: "small" },
      ],
      [
        { text: judul, style: "docTitle", alignment: "right" },
        { text: nomor, style: "docNumber", alignment: "right" },
        { text: tanggal(tgl), style: "muted", alignment: "right" },
      ],
    ],
  },
  { canvas: [{ type: "line", x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 1.2, lineColor: "#1d4ed8" }] },
];

const styles = {
  brand: { fontSize: 17, bold: true, color: "#1d4ed8" },
  docTitle: { fontSize: 19, bold: true, color: "#111827" },
  docNumber: { fontSize: 10, bold: true, color: "#374151", margin: [0, 2, 0, 0] },
  muted: { fontSize: 9, color: "#6b7280" },
  small: { fontSize: 8, color: "#6b7280" },
  label: { fontSize: 8, bold: true, color: "#6b7280" },
  th: { fontSize: 9, bold: true, color: "#111827", fillColor: "#f3f4f6" },
  td: { fontSize: 9, color: "#111827" },
  total: { fontSize: 12, bold: true, color: "#1d4ed8" },
  footer: { fontSize: 8, color: "#9ca3af", italics: true },
};

const tableLayout = {
  hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
  vLineWidth: () => 0,
  hLineColor: (i: number) => (i === 1 ? "#9ca3af" : "#e5e7eb"),
  paddingTop: () => 6,
  paddingBottom: () => 6,
};

async function build(docDefinition: any, outFile: string) {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await pdfmake.createPdf({ defaultStyle: { font: "Helvetica" }, styles, ...docDefinition }).write(outFile);
}

async function notaPembelian() {
  const trxs = await prisma.inboundTransaction.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const t of trxs) {
    // receiptUrl berbentuk "/uploads/receipts/NOTA-....pdf" -> tulis ke path fisiknya
    const rel = t.receiptUrl.replace(/^\/uploads\//, "");
    const outFile = path.join(UPLOADS, rel);
    const nomor = path.basename(rel, ".pdf");

    const supplier = /Mitra Laptop/.test(t.notes || "")
      ? { nama: "CV Mitra Laptop Indonesia", alamat: "Jl. Mangga Dua Raya Blok C No. 24, Jakarta Pusat", npwp: "02.876.543.2-073.000" }
      : { nama: "PT Sinar Komputer Nusantara", alamat: "Jl. Gatot Subroto Kav. 45, Jakarta Selatan", npwp: "01.556.789.1-054.000" };

    let total = 0;
    const body: any[] = [
      [
        { text: "No.", style: "th" },
        { text: "SKU", style: "th" },
        { text: "Nama Barang", style: "th" },
        { text: "Qty", style: "th", alignment: "center" },
        { text: "Harga Beli", style: "th", alignment: "right" },
        { text: "Subtotal", style: "th", alignment: "right" },
      ],
    ];

    t.items.forEach((it, i) => {
      const buy = Number(it.buyPrice);
      const sub = buy * it.qty;
      total += sub;
      body.push([
        { text: String(i + 1), style: "td" },
        { text: it.product.sku, style: "td" },
        { text: it.product.name, style: "td" },
        { text: String(it.qty), style: "td", alignment: "center" },
        { text: rupiah(buy), style: "td", alignment: "right" },
        { text: rupiah(sub), style: "td", alignment: "right" },
      ]);
    });

    const ppn = Math.round(total * 0.11);

    await build(
      {
        pageMargins: [40, 40, 40, 50],
        content: [
          ...kop("NOTA PEMBELIAN", nomor, t.createdAt),
          {
            margin: [0, 16, 0, 14],
            columns: [
              [
                { text: "DITERIMA DARI (SUPPLIER)", style: "label" },
                { text: supplier.nama, style: "td", bold: true, margin: [0, 3, 0, 0] },
                { text: supplier.alamat, style: "small" },
                { text: "NPWP " + supplier.npwp, style: "small" },
              ],
              [
                { text: "KETERANGAN", style: "label", alignment: "right" },
                { text: t.notes || "-", style: "small", alignment: "right", margin: [0, 3, 0, 0] },
                { text: `Total unit diterima: ${t.totalItemsOnReceipt}`, style: "small", alignment: "right" },
              ],
            ],
          },
          {
            table: { headerRows: 1, widths: [18, 92, "*", 30, 72, 78], body },
            layout: tableLayout,
          },
          {
            margin: [0, 14, 0, 0],
            columns: [
              { width: "*", text: "" },
              {
                width: 240,
                table: {
                  widths: ["*", "auto"],
                  body: [
                    [{ text: "Subtotal", style: "td" }, { text: rupiah(total), style: "td", alignment: "right" }],
                    [{ text: "PPN 11% (termasuk)", style: "td" }, { text: rupiah(ppn), style: "td", alignment: "right" }],
                    [{ text: "TOTAL DIBAYAR", style: "total" }, { text: rupiah(total), style: "total", alignment: "right" }],
                  ],
                },
                layout: tableLayout,
              },
            ],
          },
          {
            margin: [0, 40, 0, 0],
            columns: [
              [
                { text: "Diserahkan oleh,", style: "small", alignment: "center" },
                { text: "\n\n\n", style: "small" },
                { text: "( .......................... )", style: "small", alignment: "center" },
                { text: supplier.nama, style: "small", alignment: "center" },
              ],
              [
                { text: "Diterima oleh,", style: "small", alignment: "center" },
                { text: "\n\n\n", style: "small" },
                { text: "( Admin Emobo )", style: "small", alignment: "center" },
                { text: TOKO.nama, style: "small", alignment: "center" },
              ],
            ],
          },
        ],
        footer: {
          text: "Dokumen ini dihasilkan otomatis oleh sistem Emobo E-Commerce dan sah tanpa tanda tangan basah.",
          style: "footer",
          alignment: "center",
          margin: [0, 16, 0, 0],
        },
      },
      outFile
    );

    console.log(`nota   ${rel}  (${t.items.length} baris, ${rupiah(total)})`);
  }

  return trxs.length;
}

async function invoiceOrder() {
  const orders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    include: { items: { include: { product: true } }, profile: true },
    orderBy: { createdAt: "asc" },
  });

  for (const o of orders) {
    const addr: any = o.shippingAddr ?? {};
    let subtotal = 0;

    const body: any[] = [
      [
        { text: "No.", style: "th" },
        { text: "Produk", style: "th" },
        { text: "Qty", style: "th", alignment: "center" },
        { text: "Harga Satuan", style: "th", alignment: "right" },
        { text: "Total", style: "th", alignment: "right" },
      ],
    ];

    o.items.forEach((it, i) => {
      const line = Number(it.total_price);
      subtotal += line;
      body.push([
        { text: String(i + 1), style: "td" },
        { text: `${it.product.name}\n${it.product.sku}`, style: "td" },
        { text: String(it.qty), style: "td", alignment: "center" },
        { text: rupiah(Number(it.unitPrice)), style: "td", alignment: "right" },
        { text: rupiah(line), style: "td", alignment: "right" },
      ]);
    });

    const outFile = path.join(UPLOADS, "invoices", `${o.id}.pdf`);

    await build(
      {
        pageMargins: [40, 40, 40, 50],
        content: [
          ...kop("INVOICE", `#${o.id}`, o.createdAt),
          {
            margin: [0, 16, 0, 14],
            columns: [
              [
                { text: "DITAGIHKAN KEPADA", style: "label" },
                { text: addr.name || o.profile?.name || "Pelanggan", style: "td", bold: true, margin: [0, 3, 0, 0] },
                { text: addr.address || "-", style: "small" },
                { text: [addr.city, addr.province].filter(Boolean).join(", ") || "-", style: "small" },
                { text: addr.phone || o.phone, style: "small" },
              ],
              [
                { text: "STATUS PEMBAYARAN", style: "label", alignment: "right" },
                { text: "LUNAS", style: "td", bold: true, color: "#15803d", alignment: "right", margin: [0, 3, 0, 0] },
                { text: `Pengiriman: ${o.shippingService || "-"}`, style: "small", alignment: "right", margin: [0, 6, 0, 0] },
                { text: `No. Resi: ${o.trackingNo || "-"}`, style: "small", alignment: "right" },
              ],
            ],
          },
          {
            table: { headerRows: 1, widths: [18, "*", 30, 90, 92], body },
            layout: tableLayout,
          },
          {
            margin: [0, 14, 0, 0],
            columns: [
              { width: "*", text: "" },
              {
                width: 250,
                table: {
                  widths: ["*", "auto"],
                  body: [
                    [{ text: "Subtotal", style: "td" }, { text: rupiah(subtotal), style: "td", alignment: "right" }],
                    [{ text: "Ongkos Kirim", style: "td" }, { text: rupiah(Number(o.shippingCost)), style: "td", alignment: "right" }],
                    [{ text: "Biaya Layanan", style: "td" }, { text: rupiah(Number(o.appFee)), style: "td", alignment: "right" }],
                    [{ text: "PPN 11% (termasuk)", style: "td" }, { text: rupiah(Number(o.taxAmount)), style: "td", alignment: "right" }],
                    [{ text: "TOTAL PEMBAYARAN", style: "total" }, { text: rupiah(Number(o.total_grand)), style: "total", alignment: "right" }],
                  ],
                },
                layout: tableLayout,
              },
            ],
          },
          {
            margin: [0, 30, 0, 0],
            text: "Terima kasih telah berbelanja di Emobo E-Commerce.",
            style: "muted",
            alignment: "center",
          },
        ],
        footer: {
          text: "Invoice ini sah dan diproses oleh sistem komputer.",
          style: "footer",
          alignment: "center",
          margin: [0, 16, 0, 0],
        },
      },
      outFile
    );
  }

  console.log(`invoice  ${orders.length} file di uploads/invoices/`);
  return orders.length;
}

async function main() {
  const notas = await notaPembelian();
  const invoices = await invoiceOrder();
  console.log(`\nSelesai: ${notas} nota pembelian, ${invoices} invoice order.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
