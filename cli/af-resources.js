import { Command } from "commander";
import { importJson } from "../lib/importJson.js";

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .configureHelp({
    sortSubcommands: true,
  })
  .command("list", "List available data resources")
  .command("view", "Show definition of a data resource")
  .command("generate", "Generate script to use a data resource")
  .command("add", "Add a data resource")
  .command("delete", "Delete a data resource");

await program.parseAsync(process.argv);
