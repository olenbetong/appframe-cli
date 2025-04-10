import chalk from "chalk";

import { Command } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { importJson } from "./lib/importJson.js";
import { getServerFromOptions } from "./lib/getServerFromOptions.js";

const appPkg = await importJson("../package.json");

async function listResources(search: string | null | undefined, options: { server: string }) {
	await getServerFromOptions(options);
	let server = new Server(options.server);
	await server.login();
	let resources = await server.getResources();

	for (let resource of resources) {
		let name = `${`${chalk.blue(resource.ObjectType)}:`} ${resource.Name}`;
		if (resource.Name !== resource.DBObjectID) {
			name += ` (${resource.DBObjectID})`;
		}

		if (!search || name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
			console.log(name);
		}
	}
}

const program = new Command();
program
	.version(appPkg.version)
	.addServerOption()
	.action(listResources)
	.argument("[search]", "Optionally filter and display only resources containing the search string");

await program.parseAsync(process.argv);
