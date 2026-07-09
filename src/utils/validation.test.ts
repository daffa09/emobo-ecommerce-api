import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, isValidPassword, isValidRating, isValidOrderStatus } from "./validation";

// Nilai batas di file ini harus sama persis dengan tabel BVA/EP di docs/BLACK_BOX_TESTING.md

test("BVA rating: batas bawah 1, batas atas 5", () => {
  assert.equal(isValidRating(0), false); // di bawah batas bawah
  assert.equal(isValidRating(1), true); // batas bawah
  assert.equal(isValidRating(5), true); // batas atas
  assert.equal(isValidRating(6), false); // di atas batas atas
  assert.equal(isValidRating(4.5), false); // bukan bilangan bulat
  assert.equal(isValidRating(Number("abc")), false); // NaN dari Number(rating)
});

test("BVA password: minimal 6 karakter", () => {
  assert.equal(isValidPassword("12345"), false); // 5, di bawah batas
  assert.equal(isValidPassword("123456"), true); // 6, batas bawah
  assert.equal(isValidPassword("password123"), true);
});

test("EP email: partisi valid vs invalid", () => {
  assert.equal(isValidEmail("daffa.fathan9+tc01@gmail.com"), true);
  assert.equal(isValidEmail("daffafathan9.gmail.com"), false); // tanpa @
  assert.equal(isValidEmail("daffa@mail"), false); // tanpa TLD
  assert.equal(isValidEmail("daffa @mail.com"), false); // mengandung spasi
  assert.equal(isValidEmail(`${"a".repeat(45)}@b.com`), false); // 51 char, lewat VarChar(50)
});

test("State transition: hanya status pada enum yang diterima", () => {
  for (const s of ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"]) {
    assert.equal(isValidOrderStatus(s), true);
  }
  assert.equal(isValidOrderStatus("DELIVERED"), false); // tidak ada di enum
  assert.equal(isValidOrderStatus("pending"), false); // case sensitive
});
