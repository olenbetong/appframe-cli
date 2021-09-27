#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";

import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";
import { semverCompare } from "../lib/semverCompare.js";

const appPkg = await importJson("../package.json");

const program = new Command();
program
  .version(appPkg.version)
  .command(
    "update",
    "Installs latest version of @olenbetong/appframe-cli globally."
  )
  .command(
    "namespace-to-prod",
    "Generates, applies and deploys changes from dev to stage and then download them on prod."
  )
  .command("generate", "Generates transactions, and lists them")
  .alias("generate-all")
  .command("list", "Lists transactions that will be applied or deployed")
  .alias("list-transactions")
  .command(
    "apply",
    "Applies all updates on production server. Will list transactions first, and, if in a TTY environment, prompt the user before applying."
  )
  .alias("apply-prod")
  .command("deploy", "Deploy transactions")
  .command(
    "check-updates",
    "List how many updates are available to download in each namespace"
  )
  .command("download", "Download transactions")
  .command(
    "generate-data-object",
    "Generates a script to create a data API data object or procedure. (Tip: Pipe to clipboard)"
  )
  .command(
    "deploy-cra",
    "Deploy a prebuilt CRA application generated by @olenbetong/react-scripts"
  )
  .command(
    "publish-article",
    "Publishes a deployed application, generates the transaction, and sends it to the production server (download only)"
  )
  .alias("publish-to-prod")
  .command(
    "prepare-bundle",
    "Packs the current project and uploads it to Appframe bundles"
  )
  .command(
    "publish-bundle",
    "Publishes an Appframe bundle and sends it to the production server (download only)"
  )
  .command(
    "resources",
    "Tools to work with data resources used by the Data API"
  )
  .command(
    "init-app",
    "Bootstraps a new application using create-react-app with @olenbetong/react-scripts"
  )
  .showSuggestionAfterError();

program.action(async () => {
  program.outputHelp();
  let latest = await execShellCommand(
    "npm view @olenbetong/appframe-cli version"
  );
  latest = latest.trim();
  if (semverCompare(latest, appPkg.version) > 0) {
    console.log(
      chalk.yellow(
        `\nYou are running \`@olenbetong/appframe-cli\` ${appPkg.version}, which is behind the latest release (${latest}).\n`
      )
    );
  }
});

await program.parseAsync(process.argv);
