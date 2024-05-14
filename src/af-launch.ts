import chalk from "chalk";
import open from "open";

import { Command } from "./lib/Command.js";
import { importJson } from "./lib/importJson.js";

async function launchUpdater(options: { server: string; all?: boolean; browser?: string }) {
	try {
		let hostnames = [options.server ?? "dev.obet.no"];
		if (options.all) {
			hostnames = ["dev.obet.no", "stage.obet.no", "test.obet.no"];
		}

		let args;
		if (options.browser) {
			args = { app: { name: options.browser } };
		}

		for (let hostname of hostnames) {
			open(`https://${hostname}`, args);
		}
	} catch (error: any) {
		console.log(chalk.red(error.message));
		process.exit(1);
	}
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.option("-a, --all", "Overrides the server option, and opens the update application for dev, stage and prod")
	.option("-b, --browser <appname>", "Specify browser to use (chrome, firefox or msedge)")
	.addServerOption()
	.action(launchUpdater)
	.parseAsync(process.argv);
