import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("workspace shell mounts the command header and hover-aware navigation", async () => {
  const shell = await read("components/workspace-shell.tsx");

  assert.match(shell, /WorkspaceCommandCenter/);
  assert.match(shell, /data-layout-version="hover-command-v1"/);
  assert.match(shell, /data-docked="hover"/);
  assert.match(shell, /data-label=\{item\.label\}/);
  assert.match(shell, /title=\{item\.label\}/);
  assert.match(shell, /commandItems/);
});

test("global search, help, advice and AI assistance are keyboard accessible", async () => {
  const commandCenter = await read("components/workspace-command-center.tsx");

  assert.match(commandCenter, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(commandCenter, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(commandCenter, /role="dialog"/);
  assert.match(commandCenter, /aria-modal="true"/);
  assert.match(commandCenter, /workspace-command-dialog/);
  assert.match(commandCenter, /workspace-assistance-\$\{surface\}/);
  assert.match(commandCenter, /surface === "help"/);
  assert.match(commandCenter, /surface === "advice"/);
  assert.match(commandCenter, /surface === "ai"/);
  assert.match(commandCenter, /router\.push\(item\.href\)/);
  assert.match(commandCenter, /Advice is read-only and does not change business records/);
  assert.match(commandCenter, /It never posts or edits records/);
  assert.match(commandCenter, /onClick=\{\(\) => askAssistant\(prompt\)\}>\{t\(prompt\)\}/);
  assert.doesNotMatch(commandCenter, /askAssistant\(t\(prompt\)\)/);
});

test("hover expansion overlays the workspace without shifting page content", async () => {
  const [layout, css] = await Promise.all([
    read("app/layout.tsx"),
    read("app/workspace-command-center.css"),
  ]);

  assert.match(layout, /mobile-workspace\.css";\nimport "\.\/workspace-command-center\.css";/);
  assert.match(css, /--hover-rail-width: 68px/);
  assert.match(css, /--hover-rail-expanded-width: 260px/);
  assert.match(css, /> \.sidebar:hover/);
  assert.match(css, /> \.sidebar:focus-within/);
  assert.match(css, /margin-left: var\(--hover-rail-width\)/);
  assert.doesNotMatch(css, /margin-left: var\(--hover-rail-expanded-width\)/);
  assert.match(css, /workspace-command-header/);
  assert.match(css, /mobile-command-trigger/);
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /prefers-reduced-motion/);
});

test("command interface icons remain in the shared icon system", async () => {
  const icons = await read("components/ui/icon.tsx");

  for (const name of ["search", "circle-help", "lightbulb", "x"]) {
    assert.match(icons, new RegExp(`\\| "${name}"`));
    assert.match(icons, new RegExp(`${name.replace("-", "\\-")}:|"${name}":`));
  }
});
