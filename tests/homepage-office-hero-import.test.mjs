import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/page.tsx", "utf8");

test("homepage loads office hero styles", () => {
  assert.match(page, /home-office-hero\.css/);
});
