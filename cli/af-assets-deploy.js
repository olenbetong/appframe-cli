import { readFile } from "node:fs/promises";

import { importJson } from "../lib/importJson.js";
import { Server } from "../lib/Server.js";

const { appframe } = await importJson("./package.json", true);
const { assets } = appframe;

async function getProjectFileContents(file) {
  let filePath = new URL(file, `file://${process.cwd()}/`);

  return await readFile(filePath, "utf-8");
}

const server = new Server("stage.obet.no");
const result = await server.login();

if (result !== true) {
  throw Error("Login failed!");
}

if (assets.scripts) {
  for (let scriptName of Object.keys(assets.scripts)) {
    console.log(scriptName, assets.scripts[scriptName]);
    let script = assets.scripts[scriptName];
    let hostname = script.hostname ?? assets.hostname ?? appframe.hostname;

    if (typeof script === "string") {
      let content = await getProjectFileContents(script);
      await server.uploadSiteScript(hostname, scriptName, "test", content);
      await server.uploadSiteScript(hostname, scriptName, "prod", content);
    } else {
      if (script.test) {
        let content = await getProjectFileContents(script.test);
        await server.uploadSiteScript(hostname, scriptName, "test", content);
      }
      if (script.prod) {
        let content = await getProjectFileContents(script.prod);
        await server.uploadSiteScript(hostname, scriptName, "prod", content);
      }
    }
  }
}

if (assets.styles) {
  for (let styleName of Object.keys(assets.styles)) {
    let style = assets.styles[styleName];
    let hostname = style.hostname ?? assets.hostname ?? appframe.hostname;

    if (typeof style === "string") {
      let content = await getProjectFileContents(style);
      await server.uploadTemplate(hostname, styleName, "test", content);
      await server.uploadSiteStyle(hostname, styleName, "prod", content);
    } else {
      if (style.test) {
        let content = await getProjectFileContents(style.test);
        await server.uploadSiteStyle(hostname, styleName, "test", content);
      }
      if (style.prod) {
        let content = await getProjectFileContents(style.prod);
        await server.uploadSiteStyle(hostname, styleName, "prod", content);
      }
    }
  }
}

if (assets.templates) {
  for (let templateName of Object.keys(assets.templates)) {
    let template = assets.templates[templateName];
    let hostname = template.hostname ?? assets.hostname ?? appframe.hostname;

    if (typeof template === "string") {
      let content = await getProjectFileContents(template);
      await server.uploadTemplate(hostname, templateName, "test", content);
      await server.uploadTemplate(hostname, templateName, "prod", content);
    } else {
      if (template.test) {
        let content = await getProjectFileContents(template.test);
        await server.uploadTemplate(hostname, templateName, "test", content);
      }
      if (template.prod) {
        let content = await getProjectFileContents(template.prod);
        await server.uploadTemplate(hostname, templateName, "prod", content);
      }
    }
  }
}
