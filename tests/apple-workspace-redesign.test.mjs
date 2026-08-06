import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const normalized = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((offset) => channel(Number.parseInt(normalized.slice(offset, offset + 2), 16)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("Apple-grade workspace system loads last and keeps the HisabTech brand palette", async () => {
  const [layout, styles] = await Promise.all([
    read("app/layout.tsx"),
    read("app/apple-workspace-redesign.css"),
  ]);

  assert.match(layout, /import "\.\/apple-workspace-redesign\.css";/);
  assert.ok(layout.lastIndexOf("./apple-workspace-redesign.css") > layout.lastIndexOf("./commercial-platform.css"));
  assert.match(styles, /--fin-primary:\s*#da7757/i);
  assert.match(styles, /--fin-text:\s*#171717/i);
  assert.match(styles, /width:\s*264px\s*!important/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("dashboard uses premium bento hierarchy and an accessible revenue trend chart", async () => {
  const dashboard = await read("components/dashboard.tsx");

  assert.match(dashboard, /apple-grade-dashboard/);
  assert.match(dashboard, /dashboard-snapshot-card/);
  assert.match(dashboard, /dashboard-insight-grid/);
  assert.match(dashboard, /dashboard-operating-grid/);
  assert.match(dashboard, /function RevenueTrendChart/);
  assert.match(dashboard, /role="img" aria-label=\{label\}/);
  assert.match(dashboard, /dashboard-health-ring/);
  assert.doesNotMatch(dashboard, /className="chart"/);
});

test("workspace redesign applies beyond the home dashboard", async () => {
  const styles = await read("app/apple-workspace-redesign.css");

  assert.match(styles, /\.finance-page/);
  assert.match(styles, /\.sales-page/);
  assert.match(styles, /\.einvoice-page/);
  assert.match(styles, /\.recon-page/);
  assert.match(styles, /\.module-page/);
  assert.match(styles, /\.workspace-data-table/);
  assert.match(styles, /input:not\(\[type="checkbox"\]\)/);
  assert.match(styles, /\.mobile-bottom-nav/);
});

test("final contrast lock defeats legacy hero and button color inheritance", async () => {
  const [layout, fixes] = await Promise.all([
    read("app/layout.tsx"),
    read("app/apple-workspace-redesign-fixes.css"),
  ]);

  assert.ok(layout.lastIndexOf("./apple-workspace-redesign-fixes.css") > layout.lastIndexOf("./apple-workspace-redesign.css"));
  assert.match(fixes, /--fin-text:\s*#171310/i);
  assert.match(fixes, /--fin-text-secondary:\s*#463a35/i);
  assert.match(fixes, /--fin-text-muted:\s*#695a53/i);
  assert.match(fixes, /--fin-text-faint:\s*#776860/i);
  assert.match(fixes, /\.section-shell-hero[\s\S]*color:\s*var\(--fin-text\)\s*!important/);
  assert.match(fixes, /button\[type="submit"\][\s\S]*color:\s*#ffffff\s*!important/);
  assert.match(fixes, /workspace-metric-tile:nth-child\(5\)[\s\S]*color:\s*#ffffff\s*!important/);

  assert.ok(contrast("#171310", "#ffffff") >= 7, "primary light-theme text must exceed WCAG AAA contrast");
  assert.ok(contrast("#463a35", "#ffffff") >= 7, "secondary light-theme text must exceed WCAG AAA contrast");
  assert.ok(contrast("#695a53", "#f8f2ef") >= 4.5, "muted light-theme text must meet WCAG AA contrast");
  assert.ok(contrast("#776860", "#f8f2ef") >= 4.5, "faint light-theme text must meet WCAG AA contrast");
  assert.ok(contrast("#d3cbc6", "#1d1b19") >= 7, "secondary dark-theme text must exceed WCAG AAA contrast");
  assert.ok(contrast("#a89d96", "#1d1b19") >= 4.5, "faint dark-theme text must meet WCAG AA contrast");
});
