import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const environmentPath = resolve(projectRoot, ".env.local");
const outputRoot = resolve(projectRoot, "dist");
const allowedLocalEnvironmentFile = resolve(outputRoot, "server", ".dev.vars");
const privateKeyPattern = /(TOKEN|SECRET|PASSWORD|PRIVATE_KEY|ADMIN_EMAILS|ADMIN_USER_IDS)/i;

function parsePrivateValues(source) {
  const values = [];

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (key.startsWith("NEXT_PUBLIC_") || !privateKeyPattern.test(key)) continue;

    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }

    if (value.length >= 8) values.push({ key, value });
  }

  return values;
}

function collectFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(absolutePath));
    else if (entry.isFile()) files.push(absolutePath);
  }

  return files;
}

if (!existsSync(outputRoot)) {
  throw new Error("Cloudflare output is missing. Run pnpm run build:cloudflare first.");
}

const ignoredCheck = spawnSync(
  "git",
  ["check-ignore", "--quiet", relative(projectRoot, allowedLocalEnvironmentFile)],
  { cwd: projectRoot },
);

if (ignoredCheck.status !== 0) {
  throw new Error("dist/server/.dev.vars is not protected by Git ignore rules.");
}

if (!existsSync(environmentPath)) {
  process.stdout.write(
    "No .env.local file was present; private-value artifact scan was skipped.\n",
  );
  process.exit(0);
}

const privateValues = parsePrivateValues(readFileSync(environmentPath, "utf8"));

if (privateValues.length === 0) {
  process.stdout.write(
    "No configured private values were eligible for artifact scanning.\n",
  );
  process.exit(0);
}

const findings = [];

for (const filePath of collectFiles(outputRoot)) {
  if (filePath === allowedLocalEnvironmentFile || statSync(filePath).size === 0) {
    continue;
  }

  const contents = readFileSync(filePath);
  for (const { key, value } of privateValues) {
    if (contents.includes(Buffer.from(value))) {
      findings.push({ key, file: relative(projectRoot, filePath) });
    }
  }
}

if (findings.length > 0) {
  const summary = findings
    .map(({ key, file }) => `${key} found in ${file}`)
    .join("\n");
  throw new Error(`Private values were embedded in build artifacts:\n${summary}`);
}

process.stdout.write(
  `Artifact scan passed for ${privateValues.length} configured private value(s).\n`,
);
