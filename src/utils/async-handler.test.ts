import test from "node:test";
import assert from "node:assert";
import { asyncHandler } from "./async-handler";

const fakeReq = {} as any;
const fakeRes = {} as any;

const run = (fn: any, code?: number) =>
  new Promise<any>((resolve) => {
    asyncHandler(fn, code)(fakeReq, fakeRes, resolve as any);
  });

test("meneruskan error ke next() dengan kode fallback 400", async () => {
  const err = await run(async () => {
    throw new Error("gagal");
  });
  assert.strictEqual(err.message, "gagal");
  assert.strictEqual(err.statusCode, 400);
});

test("menghormati kode fallback yang diberikan", async () => {
  const err = await run(async () => {
    throw new Error("tidak ketemu");
  }, 404);
  assert.strictEqual(err.statusCode, 404);
});

test("statusCode bawaan error tidak ditimpa", async () => {
  const err = await run(async () => {
    const e: any = new Error("terlarang");
    e.statusCode = 403;
    throw e;
  }, 400);
  assert.strictEqual(err.statusCode, 403);
});

test("handler sukses tidak memanggil next()", async () => {
  let nextCalled = false;
  await asyncHandler(async () => "ok")(fakeReq, fakeRes, (() => {
    nextCalled = true;
  }) as any);
  assert.strictEqual(nextCalled, false);
});

test("error sinkron (bukan promise) tetap tertangkap", async () => {
  const err = await run(() => {
    throw new Error("meledak duluan");
  });
  assert.strictEqual(err.message, "meledak duluan");
  assert.strictEqual(err.statusCode, 400);
});
