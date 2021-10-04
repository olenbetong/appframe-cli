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
  );

await program.parseAsync(process.argv);
