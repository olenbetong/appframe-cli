import chalk from "chalk";
import prompts from "prompts";

import { Command, ServerOption } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { getServerFromOptions } from "./lib/getServerFromOptions.js";
import { importJson } from "./lib/importJson.js";

const isInteractive = process.stdout.isTTY;

type ApplyOptions = ServerOption & {
	preapprove?: string[];
};

function collect(value: string, previous: string[]) {
	return previous.concat([value]);
}

async function applyTransactions(namespaceArg: string, options: ApplyOptions) {
	try {
		await getServerFromOptions(options);
		let server = new Server(options.server);
		let result = await server.login();
		let namespace = await server.getNamespaceArgument(namespaceArg, options);

		if (result !== true) {
			throw Error("Login failed!");
		}

		let transactions = await server.getTransactions("apply", namespace);
		let onHold = await server.dsTransactions.retrieve({
			whereClause: `[Type] <> 98 AND [Namespace] = '${namespace}' AND [Status] = 4`,
			maxRecords: -1,
		});

		let errors = transactions.filter((r) => r.Status == 2);
		if (transactions.length === 0) {
			console.error(chalk.yellow("No transactions available to apply."));
		} else if (errors.length > 0) {
			console.error(
				chalk.red(
					"There are transactions with errors blocking this namespace:",
				),
			);
			console.table(errors.map(({ Status, ...tran }) => tran));
		} else {
			let isApproved = true;

			transactions.forEach((transaction) => {
				if (!options.preapprove?.includes(transaction.Name)) {
					isApproved = false;
				}
			});

			console.table(transactions);

			if (isApproved) {
				console.log(chalk.blue("All transactions approved by CLI parameters."));
			} else if (isInteractive) {
				if (onHold.length > 0) {
					console.log("");
					console.log(
						chalk.yellow(
							`CAUTION! There are ${onHold.length} transactions on hold in namespace ${namespace}. Be certain that your updates don't depend on them before applying!`,
						),
					);
					console.log("");
				}

				let result = await prompts({
					type: "confirm",
					name: "confirmApply",
					message: "Are you sure you want to apply these transactions? (n)",
					initial: false,
				});

				if (!result.confirmApply) {
					process.exit(0);
				}
			}

			await server.apply(namespace);
			server.logServerMessage("Done.");
		}
	} catch (error) {
		console.error(chalk.red((error as Error).message));
		process.exit(1);
	}
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.addServerOption()
	.addNamespaceArgument()
	.option(
		"-p, --preapprove <value>",
		"names of updates that can be applied without prompting the user first",
		collect,
		[],
	)
	.action(applyTransactions);

await program.parseAsync(process.argv);
