import { Command } from "commander";
import { importJson } from "./lib/importJson.js";

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .description(
    "Commands to create, upload and publish af bundles from npm packages"
  )
  .configureHelp({
    sortSubcommands: true,
  })
  .command("create", "Create a new bundle project")
  .command("upload", "Packs and uploads an npm module to af bundles")
  .command(
    "publish",
    "Publishes the latest version of a bundle and deploys it to production without applying"
  );

await program.parseAsync(process.argv);
