import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminEmail = "mahir@hisabtech.com";

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("demo requests are emailed directly to the admin inbox", async () => {
  const emailDelivery = await source("lib/email/demo-request-email.ts");
  const action = await source("lib/actions/demo-request.ts");
  const requestPage = await source("app/request-demo/page.tsx");

  assert.match(emailDelivery, new RegExp(`ADMIN_CONTACT_EMAIL = ["']${adminEmail.replace(".", "\\.")}["']`));
  assert.match(emailDelivery, /https:\/\/api\.resend\.com\/emails/);
  assert.match(emailDelivery, /reply_to:\s*request\.email/);
  assert.match(action, /sendDemoRequestEmail\(request\)/);
  assert.match(action, /submitted=1&delivered=1/);
  assert.match(requestPage, /mailto:mahir@hisabtech\.com/);
});

test("every public mailto link points at the admin inbox", async () => {
  const { readdir } = await import("node:fs/promises");

  async function collect(dir) {
    const entries = await readdir(path.join(root, dir), { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const next = `${dir}/${entry.name}`;
      if (entry.isDirectory()) files.push(...(await collect(next)));
      else if (entry.name.endsWith(".tsx")) files.push(next);
    }
    return files;
  }

  const files = [...(await collect("app")), ...(await collect("components"))];
  const wrong = [];

  for (const file of files) {
    const contents = await source(file);
    for (const match of contents.matchAll(/mailto:([^"'`?\s]+)/g)) {
      if (match[1] !== adminEmail) wrong.push(`${file} -> ${match[1]}`);
    }
  }

  assert.deepEqual(wrong, [], `stale contact addresses: ${wrong.join(", ")}`);
});
