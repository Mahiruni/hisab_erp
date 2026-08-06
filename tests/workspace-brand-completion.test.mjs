import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("legacy workspace modules are completed with the Hisab brand system", async () => {
  const [styles, layout] = await Promise.all([
    read("app/workspace-brand-completion.css"),
    read("app/layout.tsx"),
  ]);

  assert.match(styles, /--workspace-brand:\s*#e17a5b/i);
  assert.match(styles, /--workspace-hero:\s*#1a1a1a/i);
  assert.match(styles, /\.einvoice-page/);
  assert.match(styles, /\.einvoice-hero-state/);
  assert.match(styles, /\.einvoice-filters button\.active/);
  assert.match(styles, /\.recon-provider-mark/);
  assert.match(styles, /\.finance-tabs/);
  assert.match(styles, /html\[data-theme="dark"\]/);

  assert.match(layout, /workspace-brand-completion\.css/);
  assert.ok(
    layout.indexOf('import "./workspace-brand-completion.css";') > layout.indexOf('import "./mobile-controls-menu.css";'),
    "workspace brand completion must load after legacy and mobile control styles",
  );
});
