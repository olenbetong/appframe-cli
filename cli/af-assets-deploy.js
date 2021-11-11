import { Command } from "commander";
import { readFile } from "node:fs/promises";

import { importJson } from "../lib/importJson.js";
import { Server } from "../lib/Server.js";

async function getProjectFileContents(file) {
  let filePath = new URL(file, `file://${process.cwd()}/`);

  return await readFile(filePath, "utf-8");
}

async function deployAssets(options) {
  const { appframe } = await importJson("./package.json", true);
  const server = new Server(options.server);
  const result = await server.login();
  let { assets: sites } = appframe;

  if (!Array.isArray(sites)) {
    sites = [sites];
  }

  if (result !== true) {
    throw Error("Login failed!");
  }

  for (let site of sites) {
    if (site.scripts) {
      for (let scriptName of Object.keys(site.scripts)) {
        let script = site.scripts[scriptName];
        let hostname = script.hostname ?? site.hostname ?? appframe.hostname;
        let content;
        let contentTest;

        if (typeof script === "string") {
          content = await getProjectFileContents(script);
          contentTest = content;
        } else {
          if (script.test) {
            contentTest = await getProjectFileContents(script.test);
          }
          if (script.prod) {
            content = await getProjectFileContents(script.prod);
          }
        }

        await server.uploadSiteScript(
          hostname,
          scriptName,
          content,
          contentTest
        );
      }
    }

    if (site.styles) {
      for (let styleName of Object.keys(site.styles)) {
        let style = site.styles[styleName];
        let hostname = style.hostname ?? site.hostname ?? appframe.hostname;
        let content;
        let contentTest;

        if (typeof style === "string") {
          content = await getProjectFileContents(style);
          contentTest = content;
        } else {
          if (style.test) {
            contentTest = await getProjectFileContents(style.test);
          }
          if (style.prod) {
            content = await getProjectFileContents(style.prod);
          }
        }

        await server.uploadSiteStyle(hostname, styleName, content, contentTest);
      }
    }

    if (site.templates) {
      for (let templateName of Object.keys(site.templates)) {
        let template = site.templates[templateName];
        let hostname = template.hostname ?? site.hostname ?? appframe.hostname;
        let content;
        let contentTest;

        if (typeof template === "string") {
          content = await getProjectFileContents(template);
          contentTest = content;
        } else {
          if (template.test) {
            contentTest = await getProjectFileContents(template.test);
          }
          if (template.prod) {
            content = await getProjectFileContents(template.prod);
          }
        }

        await server.uploadSiteTemplate(
          hostname,
          templateName,
          content,
          contentTest
        );
      }
    }
  }
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .option("-s, --server <server>", "Server to deploy assets to", "dev.obet.no")
  .action(deployAssets)
  .parseAsync(process.argv);
