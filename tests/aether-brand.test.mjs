import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("root metadata and app shell expose AetherERP identity", async () => {
  const [layout, shell, manifest] = await Promise.all([
    source("app/layout.tsx"),
    source("components/workspace-shell.tsx"),
    source("app/manifest.ts"),
  ]);

  assert.match(layout, /AetherERP/);
  assert.match(layout, /data-brand="aether"/);
  assert.match(layout, /aether-brand\.css/);
  assert.match(layout, /Cormorant_Garamond/);
  assert.match(layout, /Sora/);
  assert.match(shell, /data-workspace-brand="aether"/);
  assert.match(shell, /\/aether-logo\.svg/);
  assert.match(manifest, /name: "AetherERP"/);
  assert.match(manifest, /#07090C/);
});

test("primary login and customer-facing email do not expose the retired product name", async () => {
  const [login, email] = await Promise.all([
    source("app/auth/login/page.tsx"),
    source("lib/email/demo-request-email.ts"),
  ]);

  assert.doesNotMatch(login, /Hisab(?:Tech| ERP|\b)/);
  assert.doesNotMatch(email, /New Hisab|Hisab website|Re: Hisab|subject: `New Hisab/);
  assert.match(login, /Run the whole company from one desk\./);
  assert.match(email, /AetherERP/);
});

test("AetherERP visual authority contains locked brand tokens and reduced-motion protection", async () => {
  const css = await source("app/aether-brand.css");
  for (const token of ["#07090c", "#0c1117", "#121821", "#e8eef4", "#8b9bb0", "#3ee0c4", "#d4b483", "#e26d6d", "#3ddc97"]) {
    assert.match(css.toLowerCase(), new RegExp(token.replace("#", "#")));
  }
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
});

test("legacy identifiers are documented as compatibility contracts, not customer-facing branding", async () => {
  const brand = await source("lib/brand.ts");
  assert.match(brand, /LEGACY_COMPATIBILITY/);
  assert.match(brand, /migration and regression risk/);
});
