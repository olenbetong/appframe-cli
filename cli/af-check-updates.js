import chalk from "chalk";
import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

async function checkForUpdates(options) {
  try {
    let server = new Server(options.server);
    let result = await server.login();

    if (result !== true) {
      throw Error("Login failed!");
    }

    let updates = await server.checkForUpdates();
    if (updates.length === 0) {
      console.log(chalk.yellow("No updates to download."));
    } else {
      console.table(updates);
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
    "server on which to check for updates",
    "dev.obet.no"
  )
  .action(checkForUpdates);

await program.parseAsync(process.argv);
