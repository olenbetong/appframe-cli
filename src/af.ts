#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";

import { execShellCommand } from "./lib/execShellCommand.js";
import { importJson } from "./lib/importJson.js";
import { semverCompare } from "./lib/semverCompare.js";

const appPkg = await importJson("../package.json");

const program = new Command();
program
	.version(appPkg.version)
	.configureHelp({
		sortSubcommands: true,
	})
	.command("update", "Installs latest version of @olenbetong/appframe-cli globally.")
	.command("launch", "Opens the updater web application")
	.command(
		"namespace-to-prod [namespace]",
		"Generates, applies and deploys changes from dev to stage and then download them on prod.",
	)
	.alias("ntp")
	.command("generate [namespace]", "Generates transactions, and lists them")
	.command("list [namespace]", "Lists transactions that will be applied or deployed")
	.command(
		"apply [namespace]",
		"Applies all updates on production server. Will list transactions first, and, if in a TTY environment, prompt the user before applying.",
	)
	.command("deploy [namespace]", "Deploy transactions")
	.command("check-updates", "List how many updates are available to download in each namespace")
	.command("download [namespace]", "Download transactions")
	.command("resources [command]", "Tools to work with data resources used by the Data API")
	.command("vite", "Commands to use when working with a SynergiWeb application using Vite")
	.alias("v")
	.alias("app")
	.command("bundle", "Commands to create, upload and publish af bundles from npm packages")
	.command("assets", "Tools to upload and publish website assets (site scripts/styles/templates)")
	.showSuggestionAfterError();

let latestVersionPromise = execShellCommand("pnpm view @olenbetong/appframe-cli version");

program.action(async () => {
	program.outputHelp();
	let latest = await latestVersionPromise;
	latest = latest.trim();
	if (semverCompare(latest, appPkg.version) > 0) {
		console.log(
			chalk.yellow(
				`\nYou are running \`@olenbetong/appframe-cli\` ${appPkg.version}, which is behind the latest release (${latest}).\n`,
			),
		);
	}
});

await program.parseAsync(process.argv);
