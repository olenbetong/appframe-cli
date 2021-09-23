import { Command } from "commander";
import { importJson } from "../lib/importJson.js";

import { Server } from "../lib/Server.js";

async function runStageOperations(
  namespace,
  hostname,
  operations = ["download"]
) {
  let lastSuccessfulStep = "none";
  try {
    let server = new Server(hostname);
    await server.login();
    lastSuccessfulStep = "login";

    let record = await server.getNamespace(namespace);
    lastSuccessfulStep = "getArticleInformation";

    if (operations.includes("download")) {
      await server.download(record.Name);
      lastSuccessfulStep = "download";
    }

    if (operations.includes("generate")) {
      await server.generate(record.ID);
      lastSuccessfulStep = "generate";
    }

    if (operations.includes("apply")) {
      await server.apply(record.ID);
      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await server.deploy(record.ID);
      lastSuccessfulStep = "deploy";
    }
  } catch (error) {
    error.lastSuccessfulStep = lastSuccessfulStep;
    throw error;
  }
}

async function publishFromDev(namespace) {
  await runStageOperations(namespace, "dev.obet.no", [
    "publish",
    "generate",
    "deploy",
  ]);
  await runStageOperations(namespace, "stage.obet.no", [
    "download",
    "apply",
    "deploy",
  ]);
  await runStageOperations(namespace, "test.obet.no", ["download"]);
}

async function run(namespace) {
  try {
    await publishFromDev(namespace);
  } catch (error) {
    console.error(
      error.message,
      error.lastSuccessfulStep &&
        `(Last step completed: ${error.lastSuccessfulStep})`
    );
    process.exit(1);
  }
}

const appPkg = await importJson("../package.json");

const program = new Command();
program
  .version(appPkg.version)
  .argument("<namespace>", "namespace to push from dev to production")
  .action(run);

await program.parseAsync(process.argv);
