import { Command } from "../lib/Command.js";

import chalk from "chalk";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import {
  getNamespaceArgument,
  getServerFromOptions,
} from "../lib/serverSelection.js";

async function downloadTransactions(namespaceArg, options) {
  try {
    await getServerFromOptions(options);
    let server = new Server(options.server);
    let result = await server.login();
    let namespace = await getNamespaceArgument(namespaceArg, options);

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
  .addServerOption()
  .addNamespaceArgument()
  .action(downloadTransactions);

await program.parseAsync(process.argv);
