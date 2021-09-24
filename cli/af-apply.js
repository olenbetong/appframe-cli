import chalk from "chalk";
import { Command } from "commander";
import prompts from "prompts";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

const isInteractive = process.stdout.isTTY;

async function applyTransactions(namespace, options) {
  try {
    let server = new Server(options.server);
    let result = await server.login();

    if (result !== true) {
      throw Error("Login failed!");
    }

    let transactions = await server.list("apply", namespace);
    if (transactions.length === 0) {
      console.error(chalk.yellow("No transactions available to apply."));
    } else {
      console.table(transactions);
      if (isInteractive) {
        let result = await prompts({
          type: "confirm",
          name: "confirmApply",
          message: "Are you sure you want to apply these transactions? (n)",
          initial: false,
        });

        if (!result.confirmApply) {
          process.exit(0);
        }
      }

      await server.apply(namespace);
      await server.logServerMessage("Done.");
    }
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .option(
    "-s, --server <server>",
    "server on which to apply updates",
    "test.obet.no"
  )
  .argument("[namespace]", "optional namespace if you don't want to apply all")
  .action(applyTransactions);

await program.parseAsync(process.argv);