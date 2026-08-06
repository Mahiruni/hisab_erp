import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

test("Ethiopia landing page explains local operating advantages without unsupported claims", async () => {
  const page = await read("app/ethiopia/page.tsx");
  for (const copy of ["Ethiopian birr", "English and Amharic", "Mobile and bandwidth conscious", "Local implementation support"]) {
    assert.ok(page.includes(copy), `missing Ethiopia advantage: ${copy}`);
  }
  assert.match(page, /href="\/industries"/);
});

test("industry pages are generated from a shared solution model", async () => {
  const industries = await read("lib/marketing-industries.ts");
  const indexPage = await read("app/industries/page.tsx");
  const detailPage = await read("app/industries/[slug]/page.tsx");

  for (const slug of ["retail", "wholesale-distribution", "restaurants-hospitality", "professional-services", "construction", "manufacturing", "cooperatives", "import-export", "multi-branch"]) {
    assert.ok(industries.includes(`slug: "${slug}"`), `missing industry: ${slug}`);
  }
  assert.match(indexPage, /marketingIndustries\.map/);
  assert.match(detailPage, /generateStaticParams/);
  assert.match(detailPage, /getMarketingIndustry/);
  assert.match(detailPage, /industry\.capabilities\.map/);
});

test("pricing is published in ETB with monthly and annual comparison", async () => {
  const pricing = await read("lib/marketing-pricing.ts");
  const experience = await read("components/pricing-experience.tsx");
  const page = await read("app/pricing/page.tsx");

  for (const plan of ["Starter", "Growth", "Business", "Enterprise"]) assert.ok(pricing.includes(`name: "${plan}"`));
  assert.match(pricing, /monthlyEtb: 1500/);
  assert.match(pricing, /annualEtb: 15000/);
  assert.match(experience, /Monthly billing/);
  assert.match(experience, /Annual billing/);
  assert.match(page, /Transparent ETB pricing/);
});

test("new marketing routes remain public and outside the internal workspace shell", async () => {
  const proxy = await read("lib/supabase/proxy.ts");
  const shell = await read("components/workspace-shell.tsx");
  for (const route of ["/ethiopia", "/industries", "/pricing"]) {
    assert.ok(proxy.includes(`"${route}"`), `middleware missing ${route}`);
    assert.ok(shell.includes(`"${route}"`), `workspace exclusion missing ${route}`);
  }
  assert.ok(proxy.includes('"/industries/"'));
});

test("homepage and navigation surface all three new website areas", async () => {
  const home = await read("components/marketing-home.tsx");
  const chrome = await read("components/marketing-site-chrome.tsx");
  for (const route of ["/ethiopia", "/industries", "/pricing"]) {
    assert.ok(home.includes(route), `homepage missing ${route}`);
    assert.ok(chrome.includes(route), `navigation missing ${route}`);
  }
});
