import chalk from "chalk";
import prompts from "prompts";

import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { getServerFromOptions } from "../lib/getServerFromOptions.js";
import { importJson } from "../lib/importJson.js";

const isInteractive = process.stdout.isTTY;

async function applyTransactions(namespaceArg, options) {
  try {
    await getServerFromOptions(options);
    let server = new Server(options.server);
    let result = await server.login();
    let namespace = await server.getNamespaceArgument(namespaceArg, options);

    if (result !== true) {
      throw Error("Login failed!");
    }

    let transactions = await server.getTransactions("apply", namespace);
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
      server.logServerMessage("Done.");
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
  .addServerOption()
  .addNamespaceArgument()
  .action(applyTransactions);

await program.parseAsync(process.argv);
