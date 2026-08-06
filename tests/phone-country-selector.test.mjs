import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("phone country selector shows one visual flag and keeps dialing context", async () => {
  const [component, css, layout] = await Promise.all([
    read("components/auth-credentials-fields.tsx"),
    read("app/phone-auth-standard.css"),
    read("app/layout.tsx"),
  ]);

  assert.match(component, /item\.flag\} \{item\.name\} \(\{item\.dial\}\)/);
  assert.match(component, /name="countryCode" value=\{country\.dial\}/);
  assert.match(css, /\.country-control \.country-flag\{display:none!important\}/);
  assert.match(css, /\.country-control\{padding-left:0;overflow:hidden\}/);
  assert.match(css, /grid-template-columns:minmax\(210px,.95fr\) minmax\(230px,1.05fr\)/);
  assert.match(css, /@media\(max-width:640px\).*grid-template-columns:1fr/s);
  assert.match(layout, /import "\.\/phone-auth-standard\.css";/);
});
