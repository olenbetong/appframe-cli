import chalk from "chalk";
import { Command } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

async function runStageOperations(
  packageName,
  version,
  hostname,
  operations = ["download"]
) {
  let lastSuccessfulStep = "none";
  try {
    let server = new Server(hostname);
    await server.login();
    lastSuccessfulStep = "login";

    let bundle = await server.getBundle(packageName);
    if (!bundle || !bundle.ID)
      throw Error(`Bundle with name '${packageName}' not found.`);

    let { ID: id, Project_ID, Name, Namespace_ID } = bundle;
    if (!Namespace_ID) {
      throw Error(`Bundle '${packageName}' is not assigned to a namespace`);
    }

    let namespace = await server.getNamespace(Namespace_ID);
    server.logServerMessage(
      `Found bundle '${Name}' with Namespace/Project/Version: ${namespace.Name}/${id}/${Project_ID}`
    );
    lastSuccessfulStep = "getBundleInformation";

    if (operations.includes("publish")) {
      await server.publishBundle(Project_ID, id, `${packageName}@${version}`);
      lastSuccessfulStep = "publish";
    }

    if (operations.includes("download")) {
      await server.download(namespace.Name);
      lastSuccessfulStep = "download";
    }

    if (operations.includes("generate")) {
      await server.generate(namespace.ID);
      lastSuccessfulStep = "generate";
    }

    if (operations.includes("apply")) {
      await server.assertOnlyOneTransaction(
        `[Namespace_ID] = ${Namespace_ID} AND [Status] IN (0, 2, 4) AND [IsLocal] = 0`,
        packageName
      );
      await server.apply(namespace.ID);
      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await server.assertOnlyOneTransaction(
        `[Namespace_ID] = ${Namespace_ID} AND (([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)`,
        packageName
      );
      await server.deploy(namespace.ID);
      lastSuccessfulStep = "deploy";
    }
  } catch (error) {
    error.lastSuccessfulStep = lastSuccessfulStep;
    throw error;
  }
}

async function publishFromDev(packageName) {
  try {
    let name;
    let version;
    if (!packageName) {
      const pkg = await importJson("./package.json", true);
      name = pkg.name;
      version = pkg.version;
    } else {
      name = packageName;
      version = "latest";
    }

    await runStageOperations(name, version, "dev.obet.no", [
      "publish",
      "generate",
      "deploy",
    ]);
    await runStageOperations(name, version, "stage.obet.no", [
      "download",
      "apply",
      "deploy",
    ]);
    await runStageOperations(name, version, "test.obet.no", ["download"]);
  } catch (error) {
    console.log(
      chalk.red(error.message),
      error.lastSuccessfulStep &&
        `(Last step completed: ${error.lastSuccessfulStep})`
    );
    process.exit(1);
  }
}

const cliPkg = await importJson("../package.json");
let program = new Command();
program
  .version(cliPkg.version)
  .argument(
    "[package]",
    "Specify name of the package to publish, otherwise the name in package.json is used"
  )
  .action(publishFromDev);

await program.parseAsync();
