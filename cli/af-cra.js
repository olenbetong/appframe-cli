import { Command } from "commander";
import { importJson } from "../lib/importJson.js";

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
    "project-setup",
    "Ensures the project has deploy/publish scripts set up"
  )
  .command(
    "publish",
    "Publish the article, and take the transaction from dev to prod (download only)"
  )
  .command(
    "init <name>",
    "Bootstraps a new application using create-react-app with @olenbetong/react-scripts"
  );

await program.parseAsync(process.argv);
