import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageManagerCli = process.env.npm_execpath;

if (!packageManagerCli) {
  throw new Error("Run this verification through pnpm: pnpm run verify:cloudflare");
}

const wranglerCli = fileURLToPath(
  new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
);

function run(label, command, args, environment = process.env) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(command, args, {
    env: environment,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runPnpm(label, args, environment) {
  run(label, process.execPath, [packageManagerCli, ...args], environment);
}

runPnpm("Cloudflare compatibility", ["run", "check:cloudflare"]);
runPnpm("TypeScript", ["run", "typecheck"]);
runPnpm("ESLint", ["run", "lint"]);
runPnpm("Catalog tests", ["run", "test:catalog"]);
runPnpm("Cart tests", ["run", "test:cart"]);
runPnpm("Inventory and auth tests", ["run", "test:inventory"]);
runPnpm("Sanity production read", ["run", "verify:sanity:read"]);
runPnpm("Vercel regression build", ["run", "build:vercel"], {
  ...process.env,
  VERCEL: "1",
});
runPnpm("Cloudflare build", ["run", "build:cloudflare"]);
runPnpm("Private-value artifact scan", ["run", "scan:cloudflare:secrets"]);
run(
  "Cloudflare upload dry-run",
  process.execPath,
  [
    wranglerCli,
    "deploy",
    "--dry-run",
    "--config",
    "dist/server/wrangler.json",
  ],
  {
    ...process.env,
    NELA_CLOUDFLARE_STANDALONE: "1",
  },
);

process.stdout.write(
  "\nCloudflare preflight completed without publishing or changing remote state.\n",
);
