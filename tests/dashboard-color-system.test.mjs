import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("dashboard color authority loads after every legacy contrast layer", async () => {
  const layout = await read("app/layout.tsx");

  const dashboardColorIndex = layout.lastIndexOf('./dashboard-color-system.css');
  assert.ok(dashboardColorIndex > layout.lastIndexOf('./light-theme-contrast.css'));
  assert.ok(dashboardColorIndex > layout.lastIndexOf('./workspace-theme-visibility.css'));
  assert.ok(dashboardColorIndex > layout.lastIndexOf('./apple-workspace-redesign-fixes.css'));
});

test("featured result card overrides the legacy forced-white background", async () => {
  const [legacy, dashboardColors] = await Promise.all([
    read("app/light-theme-contrast.css"),
    read("app/dashboard-color-system.css"),
  ]);

  assert.match(legacy, /\.workspace-metric-tile[\s\S]*background:\s*var\(--lc-surface\)\s*!important/);
  assert.match(dashboardColors, /financial-metric-grid\s*>\s*\.workspace-metric-tile:nth-child\(5\)/);
  assert.match(dashboardColors, /linear-gradient\(135deg,\s*#171717,\s*#2d2521\s*62%,\s*#493126\)\s*!important/);
  assert.match(dashboardColors, /color:\s*#ffffff\s*!important/);
});

test("dashboard semantic cards retain visible color coding in both themes", async () => {
  const dashboardColors = await read("app/dashboard-color-system.css");

  for (const tone of ["success", "warning", "danger", "info"]) {
    assert.match(dashboardColors, new RegExp(`workspace-metric-tile\\.tone-${tone}`));
    assert.match(dashboardColors, new RegExp(`workspace-action-alert\\.tone-${tone}`));
  }

  assert.ok(contrast("#171310", "#ffffff") >= 7);
  assert.ok(contrast("#695a53", "#ffffff") >= 4.5);
  assert.ok(contrast("#ffffff", "#171717") >= 7);
  assert.ok(contrast("#d3cbc6", "#1d1b19") >= 4.5);
});
