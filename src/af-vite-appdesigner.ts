import chalk from "chalk";
import open from "open";

import { Command } from "./lib/Command.js";
import { importJson } from "./lib/importJson.js";

async function launchAppdesigner(options: {
	server: string;
	browser?: string;
}) {
	try {
		const appPackageJson = await importJson("./package.json", true);
		const { appframe } = appPackageJson;

		if (!appframe) {
			throw Error(
				"No application config was found. (Looking for appframe section in package.json)",
			);
		}
		let hostname = options.server ?? appframe?.devHostname ?? "dev.obet.no";

		let args;
		if (options.browser) {
			args = { app: { name: options.browser } };
		}

		let articleHost = appframe.article?.hostname ?? appframe.hostname;
		let articleId = appframe.article?.id ?? appframe.article;

		open(`https://${hostname}/appdesigner?${articleHost}/${articleId}`, args);
	} catch (error: any) {
		console.log(chalk.red(error.message));
		process.exit(1);
	}
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.option(
		"-b, --browser <appname>",
		"Specify browser to use (chrome, firefox or msedge)",
	)
	.addServerOption()
	.action(launchAppdesigner)
	.parseAsync(process.argv);
