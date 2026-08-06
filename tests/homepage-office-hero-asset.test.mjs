import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const encoded = (await readFile("public/hisab-ethiopian-office-hero.webp", "utf8")).trim();
const image = Buffer.from(encoded, "base64");

test("homepage office hero asset decodes as WebP", () => {
  assert.ok(image.byteLength > 10_000);
  assert.equal(image.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(image.subarray(8, 12).toString("ascii"), "WEBP");
});
