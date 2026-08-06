import { spawn } from "node:child_process";

const expectedStaticRoutes = [
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

const stripAnsi = (value) => value.replace(/\u001b\[[0-9;]*m/g, "");
const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url).pathname;
const child = spawn(process.execPath, [nextBin, "build"], {
  cwd: new URL("..", import.meta.url),
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";

for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    output += text;
    (stream === child.stdout ? process.stdout : process.stderr).write(text);
  });
}

const exitCode = await new Promise((resolve) => child.on("close", resolve));
if (exitCode !== 0) process.exit(Number(exitCode) || 1);

const lines = stripAnsi(output).split(/\r?\n/);
const staticRoutes = new Set();

for (const line of lines) {
  const match = line.match(/[┌├└]\s+[○●]\s+(\/\S*)/);
  if (match) staticRoutes.add(match[1]);
}

const missing = expectedStaticRoutes.filter((route) => !staticRoutes.has(route));
if (missing.length > 0) {
  console.error(`Public static route gate failed. Not emitted as static: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Public static route gate passed for ${expectedStaticRoutes.length} marketing routes.`);
