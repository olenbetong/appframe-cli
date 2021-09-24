import { Command } from "commander";
import prompts from "prompts";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

const isInteractive = process.stdout.isTTY;

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

    lastSuccessfulStep = "getArticleInformation";

    if (operations.includes("download")) {
      await server.download(namespace);
      lastSuccessfulStep = "download";
    }

    if (operations.includes("generate")) {
      await server.generate(namespace);
      lastSuccessfulStep = "generate";
    }

    if (operations.includes("verify-apply") && isInteractive) {
      let transactions = await server.getTransactions("apply", namespace);
      if (transactions.length > 0) {
        console.table(transactions);
        let result = await prompts({
          type: "confirm",
          name: "confirmApply",
          message: "Are you sure you want to apply these transactions? (y)",
          initial: true,
        });

        if (!result.confirmApply) {
          process.exit(0);
        }
      }
    }

    if (operations.includes("apply")) {
      await server.apply(namespace);
      lastSuccessfulStep = "apply";
    }

    if (operations.includes("verify-deploy") && isInteractive) {
      let transactions = await server.getTransactions("deploy", namespace);
      if (transactions.length > 0) {
        console.table(transactions);
        let result = await prompts({
          type: "confirm",
          name: "confirmDeploy",
          message: "Are you sure you want to deploy these transactions? (y)",
          initial: true,
        });

        if (!result.confirmDeploy) {
          process.exit(0);
        }
      }
    }

    if (operations.includes("deploy")) {
      await server.deploy(namespace);
      lastSuccessfulStep = "deploy";
    }
  } catch (error) {
    error.lastSuccessfulStep = lastSuccessfulStep;
    throw error;
  }
}

async function publishFromDev(namespace) {
  await runStageOperations(namespace, "dev.obet.no", [
    "generate",
    "verify-deploy",
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
