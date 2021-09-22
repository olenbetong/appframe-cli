#!/usr/bin/env node
import { Command } from "commander";

import { importJson } from "../lib/importJson.js";

const appPkg = await importJson("../package.json");

const program = new Command();
program
  .version(appPkg.version)
  .command(
    "deploy-cra",
    "Deploy a prebuilt CRA application generated by @olenbetong/react-scripts"
  )
  .command(
    "prepare-bundle",
    "Packs the current project and uploads it to Appframe bundles"
  )
  .command(
    "publish-to-prod",
    "Publishes a deployed application, generates the transaction, and sends it to the production server (download only)"
  )
  .command(
    "generate-data-object",
    "Generates a script to create a data API data object or procedure. (Tip: Pipe to clipboard)"
  )
  .command(
    "publish-bundle",
    "Publishes an Appframe bundle and sends it to the production server (download only)"
  )
  .command(
    "namespace-to-prod",
    "Generates, applies and daploys changes from dev to stage and then download them on prod."
  )
  .command(
    "generate-all",
    "Generates all transactions on dev server, and lists them"
  )
  .command(
    "list-transactions",
    "Lists transactions that will be applied or deployed"
  );

program.action(() => {
  program.help();
});
program.parse(process.argv);
