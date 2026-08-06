import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("workspace theme visibility is explicit for light, dark, cards and hero text", async () => {
  const [styles, layout] = await Promise.all([
    read("app/workspace-theme-visibility.css"),
    read("app/layout.tsx"),
  ]);

  assert.match(styles, /html\[data-theme="light"\] body\[data-workspace-system="financial-os-v1"\]/);
  assert.match(styles, /html\[data-theme="dark"\] body\[data-workspace-system="financial-os-v1"\]/);
  assert.match(styles, /--workspace-theme-text:\s*#211a18/i);
  assert.match(styles, /--workspace-theme-text:\s*#fff8f4/i);
  assert.match(styles, /\.financial-dashboard-hero/);
  assert.match(styles, /\[class\$="-hero"\]/);
  assert.match(styles, /--workspace-theme-hero-text/);
  assert.match(styles, /\.workspace-metric-tile/);
  assert.match(styles, /input:not\(\[type="checkbox"\]\)/);
  assert.match(styles, /\.sticky-user-popover/);

  const finalImport = 'import "./workspace-theme-visibility.css";';
  assert.match(layout, /workspace-theme-visibility\.css/);
  assert.ok(
    layout.indexOf(finalImport) > layout.indexOf('import "./auth-standard-experience.css";'),
    "workspace visibility must load after every previous UI and typography lock",
  );

  assert.ok(contrast("211a18", "ffffff") >= 7, "light workspace text must meet enhanced contrast");
  assert.ok(contrast("fff8f4", "171311") >= 7, "dark workspace text must meet enhanced contrast");
  assert.ok(contrast("fff8f4", "171717") >= 7, "hero text must remain readable in either theme");
});
