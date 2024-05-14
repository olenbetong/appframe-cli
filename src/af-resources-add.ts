import { Command } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { getServerFromOptions } from "./lib/getServerFromOptions.js";
import { importJson } from "./lib/importJson.js";

const appPkg = await importJson("../package.json");

async function addDataResource(id: string, options: { server: string; name?: string }) {
	await getServerFromOptions(options);
	let server = new Server(options.server);
	await server.login();
	await server.addDataResource(id, options.name);
}

const program = new Command();
program
	.version(appPkg.version)
	.addServerOption()
	.option("-n, --name [name]", "Name to set on the data resource")
	.argument("<id>", "Database object id for the data resource to add")
	.action(addDataResource);

await program.parseAsync(process.argv);
