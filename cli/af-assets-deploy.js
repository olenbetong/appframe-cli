import { readFile } from "node:fs/promises";

import { importJson } from "../lib/importJson.js";
import { Server } from "../lib/Server.js";

const { appframe } = await importJson("./package.json", true);
const { assets } = appframe;

async function getProjectFileContents(file) {
  let filePath = new URL(file, `file://${process.cwd()}/`);

  return await readFile(filePath, "utf-8");
}

const server = new Server("dev.obet.no");
const result = await server.login();

if (result !== true) {
  throw Error("Login failed!");
}

if (assets.scripts) {
  for (let scriptName of Object.keys(assets.scripts)) {
    let script = assets.scripts[scriptName];
    let hostname = script.hostname ?? assets.hostname ?? appframe.hostname;
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

    await server.uploadSiteScript(hostname, scriptName, content, contentTest);
  }
}

if (assets.styles) {
  for (let styleName of Object.keys(assets.styles)) {
    let style = assets.styles[styleName];
    let hostname = style.hostname ?? assets.hostname ?? appframe.hostname;
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

if (assets.templates) {
  for (let templateName of Object.keys(assets.templates)) {
    let template = assets.templates[templateName];
    let hostname = template.hostname ?? assets.hostname ?? appframe.hostname;
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
