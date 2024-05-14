import { Command } from "commander";
import { importJson } from "./lib/importJson.js";

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.description("Commands to use when working with website assets like site scripts, styles and templates")
	.configureHelp({
		sortSubcommands: true,
	})
	.command("deploy", "Upload assets according to configuration in package.json")
	.command("publish", "Publish assets according to configuration in package.json");

await program.parseAsync(process.argv);
