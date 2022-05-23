import { Command } from "commander";
import { importJson } from "./lib/importJson.js";

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .description(
    "Commands to use when working with a create-react-app application using @olenbetong/react-scripts"
  )
  .configureHelp({
    sortSubcommands: true,
  })
  .command("deploy", "Deploy the application to the article in package.json")
  .command(
    "generate-types",
    "Generate Typescript definitions for data objects and procedures in the article in package.json"
  )
  .command(
    "update-setup",
    "Ensures the project has deploy/publish scripts set up"
  )
  .command("update", "Updates individual project files")
  .command(
    "publish",
    "Publish the article, and take the transaction from dev to prod (download only)"
  )
  .command(
    "init <name>",
    "Bootstraps a new application using create-react-app with @olenbetong/react-scripts"
  )
  .command("appdesigner", "Opens the appdesigner for the current project")
  .command("convert-typescript", "Prepares the project to use typescript")
  .command(
    "copy-datasources",
    "Copies datasources for an article from SynergiDev to SynergiStage"
  )
  .command("migrate-from-cra", "Migrates a CRA project to use Vite");

await program.parseAsync(process.argv);
