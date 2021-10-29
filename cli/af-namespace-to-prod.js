import chalk from "chalk";
import prompts from "prompts";

import { Command } from "../lib/Command.js";
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

async function getNamespace(namespaceArg) {
  let server = new Server("dev.obet.no");
  await server.login();
  return await server.getNamespaceArgument(namespaceArg);
}

async function publishFromDev(namespaceArg, options) {
  let namespace = await getNamespace(namespaceArg);
  let devSteps = options.skipGenerate
    ? ["verify-deploy", "deploy"]
    : ["generate", "verify-deploy", "deploy"];

  await runStageOperations(namespace, "dev.obet.no", devSteps);
  await runStageOperations(namespace, "stage.obet.no", [
    "download",
    "apply",
    "deploy",
  ]);
  await runStageOperations(namespace, "test.obet.no", ["download"]);

  console.log("");
  console.log(`Transactions downloaded on ${chalk.green("test.obet.no")}`);
  console.log(
    `Run ${chalk.blue(`af cra apply ${namespace}`)} to apply updates.`
  );
}

async function run(namespace, options) {
  try {
    await publishFromDev(namespace, options);
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
  .addNamespaceArgument(true)
  .option("--skip-generate", "Skip the generate step")
  .action(run);

await program.parseAsync(process.argv);
