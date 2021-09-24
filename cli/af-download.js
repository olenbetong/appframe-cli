import chalk from "chalk";
import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

async function applyTransactions(namespace, options) {
  try {
    let server = new Server(options.server);
    let result = await server.login();

    if (result !== true) {
      throw Error("Login failed!");
    }

    await server.download(namespace);
    server.logServerMessage("Done.");
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
    "server on which to download updates",
    "test.obet.no"
  )
  .argument("<namespace>", "namespace to download updates for")
  .action(applyTransactions);

await program.parseAsync(process.argv);
