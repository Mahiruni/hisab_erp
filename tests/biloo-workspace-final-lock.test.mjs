import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("authenticated workspace uses Biloo source branding and final palette authority", async () => {
  const [layout, shell, styles] = await Promise.all([
    read("app/layout.tsx"),
    read("components/workspace-shell.tsx"),
    read("app/biloo-workspace-final-lock.css"),
  ]);

  const finalImport = 'import "./biloo-workspace-final-lock.css";';
  assert.match(layout, /public-navigation-home-parity\.css";\nimport "\.\/biloo-workspace-final-lock\.css";/);
  assert.equal(layout.lastIndexOf(finalImport), layout.indexOf(finalImport));

  assert.match(shell, /data-workspace-brand="biloo"/);
  assert.match(shell, /<strong>Biloo<\/strong>/);
  assert.match(shell, /<small>Biloo ERP<\/small>/);
  assert.match(shell, /aria-label="Biloo dashboard"/);
  assert.doesNotMatch(shell, />HisabTech</);
  assert.doesNotMatch(shell, />Hisab</);

  assert.match(styles, /--biloo-app-navy: #14213d/);
  assert.match(styles, /--biloo-app-gold: #fca311/);
  assert.match(styles, /#primary-sidebar\.sidebar\.supabase-sidebar/);
  assert.match(styles, /nav a\[aria-current="page"\]/);
  assert.match(styles, /background: var\(--biloo-app-navy\) !important/);
  assert.match(styles, /\.workspace-metric-tile/);
  assert.match(styles, /\.mobile-bottom-nav/);
  assert.doesNotMatch(styles, /#E17A5B/i);
  assert.doesNotMatch(styles, /terracotta/i);
});
