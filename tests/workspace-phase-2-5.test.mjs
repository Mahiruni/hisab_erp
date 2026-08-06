import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("Phase 2.5 workspace polish is scoped, loaded and motion-accessible", async () => {
  const [shell, styles, finalLock] = await Promise.all([
    read("components/workspace-shell.tsx"),
    read("app/workspace-phase-2-5.css"),
    read("app/biloo-pure-white-workspace-lock.css"),
  ]);

  assert.match(shell, /data-workspace-phase="2\.5"/);
  assert.match(shell, /data-workspace-route=\{pathname\}/);
  assert.match(finalLock, /^@import url\("\.\/workspace-phase-2-5\.css"\);/);

  assert.match(styles, /\.erp-shell\[data-workspace-phase="2\.5"\]/);
  assert.match(styles, /font-family: -apple-system/);
  assert.match(styles, /phase25-route-enter/);
  assert.match(styles, /\.sidebar nav a\.active/);
  assert.match(styles, /\.mobile-bottom-nav/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
