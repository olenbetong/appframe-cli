import chalk from "chalk";

import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import { getServerFromOptions } from "../lib/getServerFromOptions.js";

const appPkg = await importJson("../package.json");

async function listResources(options) {
  await getServerFromOptions(options);
  let server = new Server(options.server);
  await server.login();
  let resources = await server.getResources();

  for (let resource of resources) {
    let name = `${chalk.blue(resource.ObjectType) + ":"} ${resource.Name}`;
    if (resource.Name !== resource.DBObjectID) {
      name += ` (${resource.DBObjectID})`;
    }

    console.log(name);
  }
}

const program = new Command();
program.version(appPkg.version).addServerOption().action(listResources);

await program.parseAsync(process.argv);
