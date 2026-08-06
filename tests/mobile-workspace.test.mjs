import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync("components/workspace-shell.tsx", "utf8");
const mobileCss = fs.readFileSync("app/mobile-workspace.css", "utf8");
const desktopCss = fs.readFileSync("app/docked-sidebar.css", "utf8");
const layout = fs.readFileSync("app/layout.tsx", "utf8");

test("mobile workspace adds an app header, drawer and bottom navigation", () => {
  assert.match(shell, /mobile-workspace-header/);
  assert.match(shell, /mobile-menu-trigger/);
  assert.match(shell, /mobile-nav-backdrop/);
  assert.match(shell, /mobile-bottom-nav/);
  assert.match(shell, /data-mobile-nav-open/);
  assert.match(shell, /aria-controls="primary-sidebar"/);
  assert.match(shell, /aria-expanded=\{mobileNavOpen\}/);
});

test("mobile navigation closes on route change and Escape", () => {
  assert.match(shell, /setMobileNavOpen\(false\)/);
  assert.match(shell, /event\.key === "Escape"/);
  assert.match(shell, /document\.body\.style\.overflow = "hidden"/);
});

test("desktop navigation remains intact while mobile uses a drawer", () => {
  assert.match(desktopCss, /--docked-sidebar-width: 248px/);
  assert.match(desktopCss, /margin-left: var\(--docked-sidebar-width\)/);
  assert.match(mobileCss, /@media \(max-width: 760px\)/);
  assert.match(mobileCss, /transform: translate3d\(-108%, 0, 0\)/);
  assert.match(mobileCss, /data-mobile-nav-open="true"/);
  assert.match(mobileCss, /width: 100% !important/);
  assert.match(mobileCss, /margin-left: 0 !important/);
});

test("mobile content is touch friendly and responsive", () => {
  assert.match(mobileCss, /--mobile-bottom-nav-height: 68px/);
  assert.match(mobileCss, /min-height: 44px/);
  assert.match(mobileCss, /grid-template-columns: 1fr !important/);
  assert.match(mobileCss, /overflow-x: auto/);
  assert.match(mobileCss, /scroll-snap-type: inline mandatory/);
  assert.match(mobileCss, /env\(safe-area-inset-bottom\)/);
  assert.match(mobileCss, /html\[data-theme="dark"\] \.mobile-bottom-nav/);
});

test("mobile styles load after existing desktop and workspace styles", () => {
  const desktopIndex = layout.indexOf('import "./docked-sidebar.css"');
  const standardIndex = layout.indexOf('import "./workspace-standardization.css"');
  const mobileIndex = layout.indexOf('import "./mobile-workspace.css"');
  assert.ok(desktopIndex >= 0);
  assert.ok(standardIndex > desktopIndex);
  assert.ok(mobileIndex > standardIndex);
});
