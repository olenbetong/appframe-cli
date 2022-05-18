/* global globalThis */
import chalk from "chalk";
import vm from "node:vm";
import fs from "node:fs/promises";

import {
  DataObject,
  Procedure,
  Client,
  setDefaultClient,
} from "@olenbetong/data-object";

import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { generateTypes } from "../lib/generateTypes.js";
import { importJson } from "../lib/importJson.js";

const appPkg = await importJson("./package.json", true);
const cliPkg = await importJson("../package.json");

setDefaultClient(new Client("dev.obet.no"));

globalThis.af = {
  controls: {},
  common: {
    expose,
    localStorage: {
      get(value, fallback) {
        return fallback;
      },
    },
  },
  DataObject,
  Procedure,
};

globalThis.af.controls = new Proxy(globalThis.af.controls, {
  get: () => class {},
});

function expose(path, value) {
  let properties = path.split(".");
  let final = properties.pop();
  let current = globalThis;
  for (let property of properties) {
    if (!current[property]) {
      current[property] = {};
    }
    current = current[property];
  }

  current[final] = value;
}

async function projectFileExists(file) {
  try {
    let url = new URL(file, `file://${process.cwd()}/`);

    await fs.access(url);
    return true;
  } catch (error) {
    return false;
  }
}

async function generateTypescriptTypes(options) {
  let articleHost =
    appPkg.appframe.article?.hostname ?? appPkg.appframe.hostname;
  let articleId = appPkg.appframe.article?.id ?? appPkg.appframe.article;
  let articleUrl = `${articleHost}/${articleId}`;

  let server = new Server(
    options.server ??
      appPkg.appframe.proxy?.hostname ??
      appPkg.appframe.deploy?.hostname ??
      appPkg.appframe.devHostname ??
      "dev.obet.no"
  );
  await server.login();
  server.logServerMessage(
    chalk.blueBright(`Generating data object types for '${articleUrl}'...`)
  );

  let result = await server.fetch(
    `/file/article/static-script/${articleId}.js`
  );
  let scriptText = await result.text();

  let context = vm.createContext(globalThis);
  let script = new vm.Script(scriptText);
  try {
    script.runInContext(context);

    let customTypesPath = "./src/customTypes.d.ts";
    let hasCustomTypesFile = await projectFileExists(customTypesPath);
    if (!hasCustomTypesFile) {
      customTypesPath = "./src/customTypes.ts";
      hasCustomTypesFile = await projectFileExists(customTypesPath);
    }

    let typeOverrides = {};
    try {
      let appOverrides = await importJson("./types.json", true);
      typeOverrides = appOverrides;
    } catch (error) {
      console.log("No 'types.json' file was found with type overrides.");
    }

    let types = generateTypes(hasCustomTypesFile, typeOverrides);
    let data = new Uint8Array(Buffer.from(types));

    server.logServerMessage(
      `Writing generated types to './src/dataObjects.d.ts'...`
    );

    await fs.writeFile(
      new URL("./src/dataObjects.d.ts", `file://${process.cwd()}/`),
      data
    );

    server.logServerMessage("Done.");
  } catch (error) {
    console.log(chalk.red(error.message));
  }
}

const program = new Command();
program
  .version(cliPkg.version)
  .addServerOption(true)
  .action(generateTypescriptTypes);

await program.parseAsync(process.argv);
