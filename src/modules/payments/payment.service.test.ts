import { test } from "node:test";
import assert from "node:assert/strict";
import { splitInstallments } from "./payment.service";

const LIMIT = 10_000_000;

test("splitInstallments: di bawah/sama limit -> 1 termin (backward compatible)", () => {
  assert.deepEqual(splitInstallments(5_000_000), [5_000_000]);
  assert.deepEqual(splitInstallments(9_000_000), [9_000_000]);
  assert.deepEqual(splitInstallments(10_000_000), [10_000_000]);
});

test("splitInstallments: kelipatan bulat -> termin rata & penuh", () => {
  assert.deepEqual(splitInstallments(20_000_000), [10_000_000, 10_000_000]);
  assert.deepEqual(splitInstallments(30_000_000), [10_000_000, 10_000_000, 10_000_000]);
});

test("splitInstallments: total tak habis dibagi -> sum tetap total, tiap termin <= limit", () => {
  for (const total of [11_000_000, 25_000_000, 12_345_678, 99_999_999]) {
    const parts = splitInstallments(total);
    assert.equal(parts.reduce((a, b) => a + b, 0), total, `sum harus === ${total}`);
    assert.ok(Math.max(...parts) <= LIMIT, `tiap termin harus <= ${LIMIT}`);
    assert.ok(parts.every((p) => Number.isInteger(p)), "tiap termin harus bilangan bulat");
    assert.equal(parts.length, Math.ceil(total / LIMIT), "jumlah termin = ceil(total/limit)");
  }
});
