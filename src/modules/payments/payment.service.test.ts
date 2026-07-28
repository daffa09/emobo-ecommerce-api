import { test } from "node:test";
import assert from "node:assert/strict";
import { splitInstallments } from "./payment.service";

const LIMIT = 10_000_000;

test("splitInstallments: at or below the limit -> single installment (backward compatible)", () => {
  assert.deepEqual(splitInstallments(5_000_000), [5_000_000]);
  assert.deepEqual(splitInstallments(9_000_000), [9_000_000]);
  assert.deepEqual(splitInstallments(10_000_000), [10_000_000]);
});

test("splitInstallments: exact multiples -> even, full installments", () => {
  assert.deepEqual(splitInstallments(20_000_000), [10_000_000, 10_000_000]);
  assert.deepEqual(splitInstallments(30_000_000), [10_000_000, 10_000_000, 10_000_000]);
});

test("splitInstallments: uneven total -> sum still matches, every installment <= limit", () => {
  for (const total of [11_000_000, 25_000_000, 12_345_678, 99_999_999]) {
    const parts = splitInstallments(total);
    assert.equal(parts.reduce((a, b) => a + b, 0), total, `sum must equal ${total}`);
    assert.ok(Math.max(...parts) <= LIMIT, `every installment must be <= ${LIMIT}`);
    assert.ok(parts.every((p) => Number.isInteger(p)), "every installment must be an integer");
    assert.equal(parts.length, Math.ceil(total / LIMIT), "installment count = ceil(total/limit)");
  }
});

test("splitInstallments: extras (shipping + app fee) land on the last installment only", () => {
  // 16_500_000 goods + 1_000 app fee, no shipping selected yet
  assert.deepEqual(splitInstallments(16_500_000, 1_000), [8_250_000, 8_251_000]);
  // adding shipping only moves the last installment
  assert.deepEqual(splitInstallments(16_500_000, 27_000), [8_250_000, 8_277_000]);
});

test("splitInstallments: last installment stays within the limit once extras are added", () => {
  // Regression: ceil(total/limit) would give 2 x 9_987_000, last = 10_013_000 -> rejected by Midtrans
  const parts = splitInstallments(19_974_000, 26_000);
  assert.equal(parts.length, 3, "must open a third installment to make room for extras");
  assert.ok(parts[parts.length - 1] <= LIMIT, "last installment must stay within the limit");
});

test("splitInstallments: invariants hold across subtotal/extras combinations", () => {
  const cases: [number, number][] = [
    [16_500_000, 1_000],
    [19_974_000, 26_000],
    [12_345_678, 45_000],
    [99_999_999, 123_456],
    [9_999_000, 1_000],
    [30_000_000, 0],
  ];
  for (const [subtotal, extras] of cases) {
    const parts = splitInstallments(subtotal, extras);
    const label = `subtotal=${subtotal} extras=${extras}`;
    assert.equal(parts.reduce((a, b) => a + b, 0), subtotal + extras, `sum must equal total (${label})`);
    assert.ok(Math.max(...parts) <= LIMIT, `every installment must be <= ${LIMIT} (${label})`);
    assert.ok(parts.every((p) => Number.isInteger(p)), `every installment must be an integer (${label})`);
  }
});

test("splitInstallments: caller-chosen count is honoured and the sum is preserved", () => {
  const parts = splitInstallments(16_500_000, 1_000, LIMIT, 4);
  assert.equal(parts.length, 4);
  assert.equal(parts.reduce((a, b) => a + b, 0), 16_501_000);
  assert.ok(Math.max(...parts) <= LIMIT);
});

test("splitInstallments: chosen count is clamped to the range the limit allows", () => {
  // too few -> raised to the minimum the limit permits
  assert.equal(splitInstallments(30_000_000, 0, LIMIT, 1).length, 3);
  // too many -> capped at MAX_INSTALLMENTS
  assert.equal(splitInstallments(11_000_000, 0, LIMIT, 999).length, 12);
  // junk from the client never produces fewer than the minimum
  assert.equal(splitInstallments(30_000_000, 0, LIMIT, 0).length, 3);
  assert.equal(splitInstallments(30_000_000, 0, LIMIT, -5).length, 3);
});
