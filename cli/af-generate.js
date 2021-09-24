import chalk from "chalk";
import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

async function generateAll(namespace, options) {
  let server = new Server(options.server);
  await server.login();

  await server.generate(namespace);
  let transactions = await server.list("deploy");
  if (transactions.length > 0) {
    console.table(transactions);
  } else {
    console.log(chalk.yellow("No transactions found"));
  }
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .argument(
    "[namespace]",
    "limit generate updates to a single namespace by name"
  )

  .option("-s, --server", "server on which to apply updates", "dev.obet.no")
  .action(generateAll)
  .parseAsync(process.argv);
