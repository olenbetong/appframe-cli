import chalk from "chalk";

import { Command } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { getServerFromOptions } from "./lib/getServerFromOptions.js";
import { importJson } from "./lib/importJson.js";

async function downloadTransactions(
  namespaceArg: string,
  options: { server: string }
) {
  try {
    await getServerFromOptions(options);
    let server = new Server(options.server);
    let result = await server.login();
    let namespace = await server.getNamespaceArgument(namespaceArg, options);

    if (result !== true) {
      throw Error("Login failed!");
    }

    await server.download(namespace);
    server.logServerMessage("Done.");
  } catch (error: any) {
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
