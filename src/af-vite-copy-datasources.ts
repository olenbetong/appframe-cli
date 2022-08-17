import chalk from "chalk";
import { Command } from "commander";

import { Server } from "./lib/Server.js";
import { importJson } from "./lib/importJson.js";

async function copyDatasourcesFromDev(articleWithHost?: string) {
  let config;

  if (articleWithHost) {
    let [hostname, article] = articleWithHost.split("/");
    config = {
      hostname,
      article,
    };
  } else {
    try {
      const pkg = await importJson("./package.json", true);
      config = {
        hostname: pkg.appframe.article?.hostname ?? pkg.appframe.hostname,
        article: pkg.appframe.article?.id ?? pkg.appframe.article,
      };
    } catch (error) {
      console.log(
        chalk.red(
          "Failed to load article config. Either run the command from a folder with a SynergiWeb application with appframe config in package.json, or provide an argument with hostname and article ID."
        )
      );

      process.exit(0);
    }
  }

  let server = new Server("stage.obet.no");
  await server.login();
  await server.copyDatasourcesFromDev(config.hostname, config.article);
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .argument(
    "[article-with-hostname]",
    "Select article and hostname to publish (ex. synergi.olenbetong.no/portal). Will look for a SynergiWeb config in package.json if undefined"
  )
  .action(copyDatasourcesFromDev);

await program.parseAsync(process.argv);
