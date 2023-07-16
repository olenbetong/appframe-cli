import { Command } from "commander";
import { importJson } from "./lib/importJson.js";

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.description(
		"Commands to use when working with a SynergiWeb application using Vite",
	)
	.configureHelp({
		sortSubcommands: true,
	})
	.command("deploy", "Deploy the application to the article in package.json")
	.command(
		"generate-types",
		"Generate Typescript definitions for data objects and procedures in the article in package.json",
	)
	.alias("gt")
	.command(
		"update-setup",
		"Ensures the project has deploy/publish scripts set up",
	)
	.command("update", "Updates individual project files")
	.command(
		"publish",
		"Publish the article, and take the transaction from dev to prod (download only)",
	)
	.command(
		"init <name>",
		"Bootstraps a new application using Vite with @olenbetong/appframe-vite",
	)
	.command("appdesigner", "Opens the appdesigner for the current project")
	.command("convert-typescript", "Prepares the project to use typescript")
	.command(
		"copy-datasources",
		"Copies datasources for an article from SynergiDev to SynergiStage",
	)
	.alias("cd")
	.command("migrate-from-cra", "Migrates a CRA project to use Vite")
	.command(
		"release",
		"Asks you to write release notes for the current version, and publishes the application. !!NB!! Will apply on production!",
	);

await program.parseAsync(process.argv);
