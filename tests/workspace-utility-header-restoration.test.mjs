import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("workspace utility header keeps search, help, advice and AI available", async () => {
  const [component, styles, bootstrap] = await Promise.all([
    read("components/workspace-command-center.tsx"),
    read("public/biloo-workspace-utility-header.css"),
    read("public/biloo-brand-bootstrap.js"),
  ]);

  assert.match(component, /className="workspace-command-header"/);
  assert.match(component, /className="workspace-search-trigger"/);
  assert.match(component, /setSurface\("help"\)/);
  assert.match(component, /setSurface\("advice"\)/);
  assert.match(component, /setSurface\("ai"\)/);

  assert.match(styles, /\.workspace-command-header[\s\S]*display: grid !important/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.workspace-command-header[\s\S]*display: grid !important/);
  assert.match(styles, /workspace-ai-trigger[\s\S]*--biloo-utility-navy/);
  assert.match(styles, /workspace-header-actions button > span[\s\S]*visibility: visible !important/);
  assert.match(styles, /padding-top: calc\(122px \+ env\(safe-area-inset-top\)\) !important/);

  assert.match(bootstrap, /biloo-workspace-utility-header\.css\?v=20260802-1/);
  assert.match(bootstrap, /\/Hisab AI\/g, "Biloo AI"/);
});
