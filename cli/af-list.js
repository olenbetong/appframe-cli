import { Command } from "../lib/Command.js";

import chalk from "chalk";
import { Option } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import {
  getNamespaceArgument,
  getServerFromOptions,
} from "../lib/serverSelection.js";

const appPkg = await importJson("../package.json");

async function listTransactions(namespaceArg, options) {
  let hostname = await getServerFromOptions(options);
  let server = new Server(hostname);
  await server.login();
  let namespace = await getNamespaceArgument(namespaceArg, options);
  let transactions = await server.getTransactions(options.type, namespace);

  if (transactions.length > 0) {
    console.table(transactions);
  } else {
    console.log(chalk.yellow("No transactions found."));
  }
}

let program = new Command();
program
  .version(appPkg.version)
  .addNamespaceArgument()
  .addServerOption()
  .addOption(
    new Option("-t, --type <type>", "Type of transactions to list")
      .choices(["apply", "deploy"])
      .default("apply")
  )
  .action(listTransactions);

await program.parseAsync(process.argv);
