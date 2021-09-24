import chalk from "chalk";
import { Command, Option } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

const appPkg = await importJson("../package.json");

async function listTransactions(options) {
  let server = new Server(options.server);
  await server.login();
  let transactions = await server.list(options.type);

  if (transactions.length > 0) {
    console.table(transactions);
  } else {
    console.log(chalk.yellow("No transactions found."));
  }
}

let program = new Command();
program
  .version(appPkg.version)
  .option(
    "-s, --server <hostname>",
    "Hostname to list transactions from",
    "dev.obet.no"
  )
  .addOption(
    new Option("-t, --type <type>", "Type of transactions to list")
      .choices(["apply", "deploy"])
      .default("apply")
  )
  .action(listTransactions);

await program.parseAsync(process.argv);
