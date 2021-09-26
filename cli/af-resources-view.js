import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { getServerFromOptions } from "../lib/getServerFromOptions.js";
import { importJson } from "../lib/importJson.js";

const isInteractive = process.stdin.isTTY;
const appPkg = await importJson("../package.json");

async function viewResourceDefinition(resource, options) {
  await getServerFromOptions(options);
  let server = new Server(options.server);
  await server.login();
  let resourceName = await server.getResourceArgument(resource, server);
  let definition = await server.getResourceDefinition(resourceName);
  console.log(definition);
}

const program = new Command();
program
  .version(appPkg.version)
  .addServerOption()
  .argument(
    isInteractive ? "[resource]" : "<resource>",
    "Name of the resource to show definition"
  )
  .action(viewResourceDefinition);

await program.parseAsync(process.argv);
