import { writeFile } from "node:fs/promises";

const baseUrl = (process.env.HISAB_PRODUCTION_URL || "https://www.hisabtech.com").replace(/\/$/, "");
const expectedVersion = process.env.HISAB_EXPECTED_VERSION?.trim() || null;
const reportPath = process.env.HISAB_RELEASE_REPORT || "production-release-gate-report.json";
const timeoutMs = Number(process.env.HISAB_RELEASE_TIMEOUT_MS || 20_000);

const requiredSecurityHeaders = {
  "content-security-policy": (value) => value.includes("frame-ancestors 'none'") && value.includes("object-src 'none'"),
  "strict-transport-security": (value) => value.length > 0,
  "x-content-type-options": (value) => value.toLowerCase() === "nosniff",
  "x-frame-options": (value) => value.toUpperCase() === "DENY",
};

const definitions = [
  {
    id: "health",
    path: "/api/health",
    expectedStatuses: [200],
    securityHeaders: true,
    validate: async (response, text) => {
      const payload = JSON.parse(text);
      const errors = [];
      if (payload.status !== "ok") errors.push(`status must be ok, received ${String(payload.status)}`);
      if (payload.databaseConfigured !== true) errors.push("databaseConfigured must be true");
      if (!payload.version || typeof payload.version !== "string") errors.push("deployment version is missing");
      if (expectedVersion && payload.version !== expectedVersion) {
        errors.push(`expected deployment ${expectedVersion}, received ${String(payload.version)}`);
      }
      return { errors, evidence: { service: payload.service, version: payload.version, databaseConfigured: payload.databaseConfigured } };
    },
  },
  {
    id: "sign-in-page",
    path: "/auth/sign-in",
    expectedStatuses: [200],
    securityHeaders: true,
    validate: async (_response, text) => ({
      errors: ["HisabTech", "Welcome back", "Business email"].filter((marker) => !text.includes(marker)).map((marker) => `missing sign-in marker: ${marker}`),
    }),
  },
  {
    id: "sign-up-page",
    path: "/auth/email-sign-up",
    expectedStatuses: [200],
    validate: async (_response, text) => ({ errors: text.includes("HisabTech") ? [] : ["sign-up page did not render HisabTech branding"] }),
  },
  {
    id: "password-recovery-page",
    path: "/auth/forgot-password",
    expectedStatuses: [200],
    validate: async (_response, text) => ({ errors: text.includes("HisabTech") ? [] : ["password-recovery page did not render HisabTech branding"] }),
  },
  {
    id: "audit-export-protection",
    path: "/api/security/audit-export",
    expectedStatuses: [401, 403],
    validate: async (_response, text) => ({ errors: /authentication|required|mfa|forbidden/i.test(text) ? [] : ["protected audit export returned an unexpected response body"] }),
  },
  {
    id: "dashboard-export-protection",
    path: "/api/reports/dashboard",
    expectedStatuses: [401, 403],
    validate: async (_response, text) => ({ errors: /authentication|required|forbidden/i.test(text) ? [] : ["protected dashboard export returned an unexpected response body"] }),
  },
];

function validateHeaders(response) {
  const errors = [];
  const evidence = {};
  for (const [name, validate] of Object.entries(requiredSecurityHeaders)) {
    const value = response.headers.get(name) || "";
    evidence[name] = value;
    if (!validate(value)) errors.push(`missing or invalid ${name}`);
  }
  return { errors, evidence };
}

async function runCheck(definition) {
  const startedAt = Date.now();
  const url = `${baseUrl}${definition.path}`;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": "HisabERP-Production-Release-Gate/1.0", accept: "text/html,application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    const errors = [];
    if (!definition.expectedStatuses.includes(response.status)) {
      errors.push(`expected HTTP ${definition.expectedStatuses.join(" or ")}, received ${response.status}`);
    }

    let validation = { errors: [], evidence: undefined };
    try {
      validation = definition.validate ? await definition.validate(response, text) : validation;
    } catch (error) {
      validation = { errors: [`response validation failed: ${error instanceof Error ? error.message : String(error)}`] };
    }
    errors.push(...validation.errors);

    let securityEvidence;
    if (definition.securityHeaders) {
      const headerValidation = validateHeaders(response);
      errors.push(...headerValidation.errors);
      securityEvidence = headerValidation.evidence;
    }

    return {
      id: definition.id,
      path: definition.path,
      url: response.url,
      status: response.status,
      passed: errors.length === 0,
      durationMs: Date.now() - startedAt,
      errors,
      evidence: validation.evidence,
      securityHeaders: securityEvidence,
    };
  } catch (error) {
    return {
      id: definition.id,
      path: definition.path,
      url,
      status: null,
      passed: false,
      durationMs: Date.now() - startedAt,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

const checks = [];
for (const definition of definitions) checks.push(await runCheck(definition));

const failed = checks.filter((check) => !check.passed);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baseUrl,
  expectedVersion,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

for (const check of checks) {
  const marker = check.passed ? "PASS" : "FAIL";
  console.log(`${marker} ${check.id} (${check.status ?? "network error"}, ${check.durationMs}ms)`);
  for (const error of check.errors) console.error(`  - ${error}`);
}
console.log(`Release-gate report: ${reportPath}`);

if (failed.length > 0) process.exitCode = 1;
