import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [command, ...rawArgs] = process.argv.slice(2);
const supportedCommands = new Set([
  "check",
  "dev",
  "build",
  "preview",
  "remote-preview",
  "deploy",
]);

if (!supportedCommands.has(command)) {
  throw new Error(
    "Expected check, dev, build, preview, remote-preview or deploy.",
  );
}

const args = [...rawArgs];
const productionConfirmation = "--confirm-production";

if (command === "deploy") {
  const confirmationIndex = args.indexOf(productionConfirmation);

  if (confirmationIndex === -1) {
    throw new Error(
      "Production deployment refused. Re-run with --confirm-production only after the remote preview has been approved.",
    );
  }

  args.splice(confirmationIndex, 1);
}

const projectEnvironment = {
  ...process.env,
  NELA_CLOUDFLARE_STANDALONE: "1",
};
const vinextCli = fileURLToPath(
  new URL("../node_modules/vinext/dist/cli.js", import.meta.url),
);
const wranglerCli = fileURLToPath(
  new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
);
const secretScanScript = fileURLToPath(
  new URL("./scan-cloudflare-secrets.mjs", import.meta.url),
);

function runNode(cli, cliArgs) {
  const result = spawnSync(process.execPath, [cli, ...cliArgs], {
    env: projectEnvironment,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (command === "check") {
  runNode(vinextCli, ["check", ...args]);
} else if (command === "dev") {
  runNode(vinextCli, ["dev", "--port", "5174", ...args]);
} else if (command === "build") {
  runNode(vinextCli, ["build", ...args]);
} else {
  runNode(vinextCli, ["build"]);
  if (command !== "preview") runNode(secretScanScript, []);
  runNode(wranglerCli, [
    command === "preview"
      ? "dev"
      : command === "remote-preview"
        ? "preview"
        : "deploy",
    "--config",
    "dist/server/wrangler.json",
    ...(command === "preview"
      ? ["--local", "--ip", "127.0.0.1", "--inspector-port", "0"]
      : []),
    ...args,
  ]);
}
