import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../.next/prerender-manifest.json", import.meta.url), "utf8"));
const expectedPublicRoutes = [
  "/",
  "/about",
  "/compare",
  "/customer-stories",
  "/ethiopia",
  "/help-center",
  "/industries",
  "/integrations",
  "/migration",
  "/pricing",
  "/product-tour",
  "/resources",
  "/trust",
];

const prerendered = new Set(Object.keys(manifest.routes ?? {}));
const missing = expectedPublicRoutes.filter((route) => !prerendered.has(route));

if (missing.length > 0) {
  console.error(`Public prerender gate failed. Dynamic routes: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Public prerender gate passed for ${expectedPublicRoutes.length} routes.`);
