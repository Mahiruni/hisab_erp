import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("keeps the marketing homepage and demo request public", async () => {
  const proxy = await readFile(path.join(root, "lib/supabase/proxy.ts"), "utf8");
  assert.match(proxy, /"\/",/);
  assert.match(proxy, /"\/request-demo",/);
  assert.match(proxy, /path !== "\/"/);
  assert.match(proxy, /path !== "\/request-demo"/);
});
