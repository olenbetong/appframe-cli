import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { getServerFromOptions } from "../lib/getServerFromOptions.js";
import { importJson } from "../lib/importJson.js";

const appPkg = await importJson("../package.json");

async function deleteDataResource(id, options) {
  await getServerFromOptions(options);
  let server = new Server(options.server);
  await server.login();
  await server.deleteDataResource(id);
}

const program = new Command();
program
  .version(appPkg.version)
  .addServerOption()
  .argument(
    "<id>",
    "Database object id or name for the data resource to delete"
  )
  .action(deleteDataResource);

await program.parseAsync(process.argv);
