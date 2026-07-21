/**
 * Membuat nota supplier untuk SKENARIO_UJI_MANUAL.md.
 *
 * Berdiri sendiri (tidak menyentuh database), karena notanya dipakai SEBELUM
 * datanya ada -- file ini yang di-upload manual di halaman Barang Masuk.
 *
 * Jalankan:  npx tsx scripts/generate-nota-skenario.ts
 * Hasil:     uploads/skenario/NOTA-SKENARIO.pdf
 */
import path from "path";
import fs from "fs/promises";

const pdfmake = require("pdfmake");
pdfmake.addFonts({
  Helvetica: {
    normal: ["Helvetica"],
    bold: ["Helvetica-Bold"],
    italics: ["Helvetica-Oblique"],
    bolditalics: ["Helvetica-BoldOblique"],
  },
});

const OUT_DIR = path.join(__dirname, "..", "uploads", "skenario");

const TOKO = {
  nama: "EMOBO E-COMMERCE",
  alamat: "Jl. Raya Cibaduyut No. 118, Bojongloa Kidul, Bandung 40235",
  kontak: "Telp 022-5401188  |  admin@emobo.com",
};

const SUPPLIER = {
  nama: "PT Sinar Komputer Nusantara",
  alamat: "Jl. Gatot Subroto Kav. 45, Jakarta Selatan",
  npwp: "01.556.789.1-054.000",
};

type Baris = { sku: string; nama: string; qty: number; buyPrice: number };

// Angka di sini harus persis sama dengan yang ada di SKENARIO_UJI_MANUAL.md.
const NOTA: { nomor: string; tanggal: string; totalTertulis: number; catatan: string; items: Baris[] }[] = [
  {
    nomor: "NOTA-SKENARIO",
    tanggal: "12 Juli 2026",
    totalTertulis: 5, // sama dengan jumlah qty -> skenario "Quantity Matched"
    catatan: "Pembelian unit demo",
    items: [{ sku: "ASUS-TUF-A15", nama: "Asus TUF Gaming A15 FA506NF", qty: 5, buyPrice: 11500000 }],
  },
];

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

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
  hLineWidth: (i: number, node: any) => (i <= 1 || i === node.table.body.length ? 1 : 0.5),
  vLineWidth: () => 0,
  hLineColor: (i: number) => (i === 1 ? "#9ca3af" : "#e5e7eb"),
  paddingTop: () => 6,
  paddingBottom: () => 6,
};

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const n of NOTA) {
    let total = 0;
    let totalQty = 0;
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

    n.items.forEach((it, i) => {
      const sub = it.buyPrice * it.qty;
      total += sub;
      totalQty += it.qty;
      body.push([
        { text: String(i + 1), style: "td" },
        { text: it.sku, style: "td" },
        { text: it.nama, style: "td" },
        { text: String(it.qty), style: "td", alignment: "center" },
        { text: rupiah(it.buyPrice), style: "td", alignment: "right" },
        { text: rupiah(sub), style: "td", alignment: "right" },
      ]);
    });

    const outFile = path.join(OUT_DIR, `${n.nomor}.pdf`);

    await pdfmake
      .createPdf({
        defaultStyle: { font: "Helvetica" },
        styles,
        pageMargins: [40, 40, 40, 50],
        content: [
          {
            columns: [
              [
                { text: TOKO.nama, style: "brand" },
                { text: TOKO.alamat, style: "small", margin: [0, 6, 0, 0] },
                { text: TOKO.kontak, style: "small" },
              ],
              [
                { text: "NOTA PEMBELIAN", style: "docTitle", alignment: "right" },
                { text: n.nomor, style: "docNumber", alignment: "right" },
                { text: n.tanggal, style: "muted", alignment: "right" },
              ],
            ],
          },
          { canvas: [{ type: "line", x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 1.2, lineColor: "#1d4ed8" }] },
          {
            margin: [0, 16, 0, 14],
            columns: [
              [
                { text: "DITERIMA DARI (SUPPLIER)", style: "label" },
                { text: SUPPLIER.nama, style: "td", bold: true, margin: [0, 3, 0, 0] },
                { text: SUPPLIER.alamat, style: "small" },
                { text: "NPWP " + SUPPLIER.npwp, style: "small" },
              ],
              [
                { text: "KETERANGAN", style: "label", alignment: "right" },
                { text: n.catatan, style: "small", alignment: "right", margin: [0, 3, 0, 0] },
                {
                  text: `Total unit tertulis di nota: ${n.totalTertulis}`,
                  style: "td",
                  bold: true,
                  alignment: "right",
                  margin: [0, 4, 0, 0],
                },
              ],
            ],
          },
          { table: { headerRows: 1, widths: [18, 106, "*", 30, 72, 78], body }, layout: tableLayout },
          {
            margin: [0, 14, 0, 0],
            columns: [
              { width: "*", text: "" },
              {
                width: 240,
                table: {
                  widths: ["*", "auto"],
                  body: [
                    [{ text: `Total Qty (${totalQty} unit)`, style: "td" }, { text: `${totalQty} pcs`, style: "td", alignment: "right" }],
                    [{ text: "Subtotal", style: "td" }, { text: rupiah(total), style: "td", alignment: "right" }],
                    [
                      { text: "PPN 11% (termasuk)", style: "td" },
                      { text: rupiah(Math.round(total * 0.11)), style: "td", alignment: "right" },
                    ],
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
                { text: SUPPLIER.nama, style: "small", alignment: "center" },
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
          text: "Dokumen contoh untuk skenario uji coba sistem Emobo E-Commerce.",
          style: "footer",
          alignment: "center",
          margin: [0, 16, 0, 0],
        },
      })
      .write(outFile);

    console.log(`nota  uploads/skenario/${n.nomor}.pdf  (${n.items.length} baris, ${rupiah(total)})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
