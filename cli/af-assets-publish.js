import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

async function publishAssets(options) {
  const pkg = await importJson("./package.json", true);
  let { assets: sites } = pkg.appframe;

  if (!Array.isArray(sites)) {
    sites = [sites];
  }

  let lastCommitId = await execShellCommand("git rev-parse --short HEAD");
  lastCommitId = lastCommitId.trim();
  let description = `v${pkg.version} (${lastCommitId})`;

  const server = new Server(options.server);
  const result = await server.login();

  if (result !== true) {
    throw Error("Login failed!");
  }

  for (let site of sites) {
    if (site.scripts) {
      for (let scriptName of Object.keys(site.scripts)) {
        let script = site.scripts[scriptName];
        let hostname =
          script.hostname ?? site.hostname ?? pkg.appframe.hostname;
        await server.publishSiteScript(hostname, scriptName, description);
      }
    }

    if (site.styles) {
      for (let styleName of Object.keys(site.styles)) {
        let style = site.styles[styleName];
        let hostname = style.hostname ?? site.hostname ?? pkg.appframe.hostname;
        await server.publishSiteStyle(hostname, styleName, description);
      }
    }

    if (site.templates) {
      for (let templateName of Object.keys(site.templates)) {
        let template = site.templates[templateName];
        let hostname =
          template.hostname ?? site.hostname ?? pkg.appframe.hostname;
        await server.publishSiteTemplate(hostname, templateName, description);
      }
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
