import { Command } from "../lib/Command.js";

import chalk from "chalk";
import prompts from "prompts";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import {
  getNamespaceArgument,
  getServerFromOptions,
} from "../lib/serverSelection.js";

const isInteractive = process.stdout.isTTY;

async function deployTransactions(namespaceArg, options) {
  try {
    await getServerFromOptions(options);
    let server = new Server(options.server);
    let result = await server.login();
    let namespace = await getNamespaceArgument(namespaceArg, options);

    if (result !== true) {
      throw Error("Login failed!");
    }

    let transactions = await server.getTransactions("deploy", namespace);
    if (transactions.length === 0) {
      console.error(chalk.yellow("No transactions available to deploy."));
    } else {
      console.table(transactions);
      if (isInteractive) {
        let result = await prompts({
          type: "confirm",
          name: "confirmDeploy",
          message: "Are you sure you want to deploy these transactions? (n)",
          initial: false,
        });

        if (!result.confirmDeploy) {
          process.exit(0);
        }
      }

      await server.deploy(namespace);
      await server.logServerMessage("Done.");
    }
  } catch (error) {
    console.log(chalk.red(error.message));
    process.exit(1);
  }
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .addNamespaceArgument()
  .addServerOption()
  .action(deployTransactions)
  .parseAsync(process.argv);
