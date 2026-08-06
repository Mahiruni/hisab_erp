import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("Biloo authenticated workspace has one responsive interaction authority", async () => {
  const [layout, styles] = await Promise.all([
    read("app/layout.tsx"),
    read("app/biloo-workspace-utility-visibility-lock.css"),
  ]);

  const authorityImport = 'import "./biloo-workspace-utility-visibility-lock.css";';
  assert.equal(layout.lastIndexOf(authorityImport), layout.indexOf(authorityImport));
  assert.match(layout, /biloo-all-workspace-routes-contrast-lock\.css";\nimport "\.\/biloo-workspace-utility-visibility-lock\.css";/);

  assert.match(styles, /--biloo-font-display: clamp\(/);
  assert.match(styles, /--biloo-control-height: 48px/);
  assert.match(styles, /@media \(min-width: 761px\) and \(max-width: 1200px\)/);
  assert.match(styles, /@media \(min-width: 1201px\)/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(prefers-contrast: more\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /touch-action: manipulation/);
  assert.match(styles, /font-size: 16px !important/);
  assert.match(styles, /min-height: 48px !important/);
  assert.match(styles, /overflow-x: auto !important/);
  assert.match(styles, /orientation: landscape/);
  assert.match(styles, /workspace-command-header/);
  assert.match(styles, /workspace-header-actions/);
});
