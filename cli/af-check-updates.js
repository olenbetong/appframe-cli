import chalk from "chalk";

import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { getServerFromOptions } from "../lib/getServerFromOptions.js";
import { importJson } from "../lib/importJson.js";

async function checkForUpdates(options) {
  try {
    await getServerFromOptions(options);
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
program.version(appPkg.version).addServerOption().action(checkForUpdates);

await program.parseAsync(process.argv);
