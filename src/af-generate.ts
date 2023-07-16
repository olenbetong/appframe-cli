import chalk from "chalk";

import { Command } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { importJson } from "./lib/importJson.js";

async function generate(namespaceArg: string, options: { server: string }) {
	let server = new Server(options.server);
	await server.login();
	let namespace = await server.getNamespaceArgument(namespaceArg, options);

	await server.generate(namespace);
	let transactions = await server.getTransactions("deploy", namespace);
	if (transactions.length > 0) {
		console.table(transactions);
	} else {
		console.log(chalk.yellow("No transactions found"));
	}
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.addNamespaceArgument()
	.option(
		"-s, --server <server>",
		"server on which to generate updates",
		"dev.obet.no",
	)
	.action(generate)
	.parseAsync(process.argv);
