import chalk from "chalk";
import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import {
  getServerFromOptions,
  getServerOption,
} from "../lib/serverSelection.js";

async function checkForUpdates(options) {
  try {
    let hostname = await getServerFromOptions(options);
    let server = new Server(hostname);
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
  .addOption(getServerOption("dev.obet.no"))
  .action(checkForUpdates);

await program.parseAsync(process.argv);
