import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [shell, component, styles, layout] = await Promise.all([
  readFile("components/workspace-shell.tsx", "utf8"),
  readFile("components/workspace-header-preferences.tsx", "utf8"),
  readFile("app/workspace-header-preferences.css", "utf8"),
  readFile("app/layout.tsx", "utf8"),
]);

test("language and appearance controls render in the workspace header", () => {
  assert.match(shell, /<WorkspaceHeaderPreferences \/>/);
  assert.doesNotMatch(shell, /className="sidebar-preferences"/);
  assert.doesNotMatch(shell, /<LanguageSelector compact \/>/);
  assert.doesNotMatch(shell, /<ThemeToggle \/>/);
  assert.match(component, /className="workspace-header-preferences-inline"/);
  assert.match(component, /<LanguageSelector compact \/>/);
  assert.match(component, /<ThemeToggle \/>/);
});

test("mobile preferences remain accessible from the menu bar", () => {
  assert.match(component, /className="workspace-header-preferences-trigger"/);
  assert.match(component, /aria-expanded=\{open\}/);
  assert.match(component, /aria-controls="workspace-mobile-preferences"/);
  assert.match(component, /closeOnEscape/);
  assert.match(component, /closeOnOutsideClick/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /right: 110px/);
  assert.match(styles, /workspace-header-preferences-popover/);
});

test("desktop preferences use standard compact header treatment", () => {
  assert.match(styles, /@media \(min-width: 761px\)/);
  assert.match(styles, /padding-right: 214px/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(30px, 1fr\)\)/);
  assert.match(styles, /workspace-header-preferences-divider/);
  assert.match(styles, /theme-toggle > span:last-child/);
  assert.match(styles, /box-shadow: none/);
});

test("header preferences support dark mode and reduced motion", () => {
  assert.match(styles, /html\[data-theme="dark"\] \.workspace-header-preferences-inline/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("header preferences stylesheet loads after the financial workspace layers", () => {
  const dashboardIndex = layout.indexOf('import "./financial-dashboard.css"');
  const preferencesIndex = layout.indexOf('import "./workspace-header-preferences.css"');
  assert.ok(dashboardIndex >= 0 && preferencesIndex > dashboardIndex);
});
