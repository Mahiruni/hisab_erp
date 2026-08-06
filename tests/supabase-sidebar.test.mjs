import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [shell, styles, layout] = await Promise.all([
  readFile("components/workspace-shell.tsx", "utf8"),
  readFile("app/supabase-sidebar.css", "utf8"),
  readFile("app/layout.tsx", "utf8"),
]);

test("workspace shell retains HisabTech information inside Supabase-style structure", () => {
  assert.match(shell, /data-layout-version="supabase-sidebar-v2"/);
  assert.match(shell, /className="sidebar supabase-sidebar"/);
  assert.match(shell, /className="sidebar-workspace-switcher"/);
  assert.match(shell, /user\.organizationName/);
  assert.match(shell, /activeItem\?\.label \?\? d\.nav\.overview/);
  assert.match(shell, /className="sidebar-group-items"/);
  assert.match(shell, /className="sidebar-footer"/);
  assert.match(shell, /Powered by/);
  assert.match(shell, /Addis Ababa, Ethiopia/);
});

test("navigation keeps every business route and permission-sensitive shell behavior", () => {
  for (const route of [
    "/modules",
    "/finance",
    "/sales",
    "/e-invoicing",
    "/reconciliation",
    "/onboarding",
    "/purchasing",
    "/inventory",
    "/hr",
    "/security",
  ]) {
    assert.ok(shell.includes(`href: "${route}"`) || shell.includes(`href="${route}"`), `missing ${route}`);
  }
  assert.match(shell, /user\.mfaRequired && user\.aal !== "aal2"/);
  assert.match(shell, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(shell, /onClick=\{\(\) => setMobileNavOpen\(false\)\}/);
});

test("desktop measurements follow Supabase Studio navigation density", () => {
  assert.match(styles, /--hover-rail-width: 56px/);
  assert.match(styles, /--hover-rail-expanded-width: 256px/);
  assert.match(styles, /font-family: "Geist Sans", Geist, Inter/);
  assert.match(styles, /min-height: 32px/);
  assert.match(styles, /font-size: 12\.5px/);
  assert.match(styles, /border-radius: 4px/);
  assert.match(styles, /width: 16px;\s*height: 16px;\s*flex: 0 0 16px;\s*stroke-width: 1\.55/s);
});

test("sidebar uses subtle Supabase-style interaction states", () => {
  assert.match(styles, /--supabase-sidebar-bg: #1c1c1c/);
  assert.match(styles, /--supabase-sidebar-accent: #3ecf8e/);
  assert.match(styles, /background: var\(--supabase-sidebar-hover\)/);
  assert.match(styles, /background: var\(--supabase-sidebar-active\)/);
  assert.match(styles, /box-shadow: inset 2px 0 0 var\(--supabase-sidebar-accent\)/);
  assert.match(styles, /\.sidebar\.supabase-sidebar:hover/);
  assert.match(styles, /\.sidebar\.supabase-sidebar:focus-within/);
  assert.match(styles, /box-shadow: none/);
});

test("mobile drawer and reduced-motion behavior remain supported", () => {
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /width: min\(296px, 88vw\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(shell, /className="mobile-bottom-nav"/);
  assert.match(shell, /className="mobile-menu-trigger"/);
});

test("Supabase override stylesheet loads last", () => {
  const commandIndex = layout.indexOf('import "./workspace-command-center.css"');
  const helpIndex = layout.indexOf('import "./help-center.css"');
  const supabaseIndex = layout.indexOf('import "./supabase-sidebar.css"');
  assert.ok(commandIndex >= 0 && helpIndex >= 0 && supabaseIndex >= 0);
  assert.ok(supabaseIndex > commandIndex);
  assert.ok(supabaseIndex > helpIndex);
});
