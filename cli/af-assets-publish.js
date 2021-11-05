import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

async function publishAssets(options) {
  const pkg = await importJson("./package.json", true);
  const { assets } = pkg.appframe;

  let lastCommitId = await execShellCommand("git rev-parse --short HEAD");
  lastCommitId = lastCommitId.trim();
  let description = `v${pkg.version} (${lastCommitId})`;

  const server = new Server(options.server);
  const result = await server.login();

  if (result !== true) {
    throw Error("Login failed!");
  }

  if (assets.scripts) {
    for (let scriptName of Object.keys(assets.scripts)) {
      let script = assets.scripts[scriptName];
      let hostname =
        script.hostname ?? assets.hostname ?? pkg.appframe.hostname;
      await server.publishSiteScript(hostname, scriptName, description);
    }
  }

  if (assets.styles) {
    for (let styleName of Object.keys(assets.styles)) {
      let style = assets.styles[styleName];
      let hostname = style.hostname ?? assets.hostname ?? pkg.appframe.hostname;
      await server.publishSiteStyle(hostname, styleName, description);
    }
  }

  if (assets.templates) {
    for (let templateName of Object.keys(assets.templates)) {
      let template = assets.templates[templateName];
      let hostname =
        template.hostname ?? assets.hostname ?? pkg.appframe.hostname;
      await server.publishSiteTemplate(hostname, templateName, description);
    }
  }
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .option("-s, --server <server>", "Server to publish assets on", "dev.obet.no")
  .action(publishAssets)
  .parseAsync(process.argv);
