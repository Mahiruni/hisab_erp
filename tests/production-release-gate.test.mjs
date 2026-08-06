import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production release gate covers public availability and protected exports", async () => {
  const source = await read("scripts/production-release-gate.mjs");
  for (const path of [
    "/api/health",
    "/auth/sign-in",
    "/auth/email-sign-up",
    "/auth/forgot-password",
    "/api/security/audit-export",
    "/api/reports/dashboard",
  ]) {
    assert.match(source, new RegExp(path.replaceAll("/", "\\/")));
  }
  assert.match(source, /databaseConfigured/);
  assert.match(source, /content-security-policy/);
  assert.match(source, /strict-transport-security/);
  assert.match(source, /x-content-type-options/);
  assert.match(source, /x-frame-options/);
  assert.match(source, /expectedStatuses: \[401, 403\]/);
  assert.match(source, /AbortSignal\.timeout/);
});

test("production release gate is scheduled and preserves evidence", async () => {
  const workflow = await read(".github/workflows/production-release-gate.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /cron: "15 3 \* \* \*"/);
  assert.match(workflow, /node scripts\/production-release-gate\.mjs/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /production-release-gate-report\.json/);
  assert.match(workflow, /retention-days: 30/);
});
