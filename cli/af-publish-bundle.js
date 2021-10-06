import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

const pkg = await importJson("./package.json", true);

async function runStageOperations(hostname, operations = ["download"]) {
  let lastSuccessfulStep = "none";
  try {
    let server = new Server(hostname);
    await server.login();
    lastSuccessfulStep = "login";

    let bundle = await server.getBundle(pkg.name);
    if (!bundle || !bundle.ID)
      throw Error(`Bundle with name '${pkg.name}' not found.`);

    let { ID: id, Project_ID, Name, Namespace_ID } = bundle;
    if (!Namespace_ID) {
      throw Error(`Bundle '${pkg.name}' is not assigned to a namespace`);
    }

    let namespace = await server.getNamespace(Namespace_ID);
    server.logServerMessage(
      `Found bundle '${Name}' with Namespace/Project/Version: ${namespace.Name}/${id}/${Project_ID}`
    );
    lastSuccessfulStep = "getBundleInformation";

    if (operations.includes("publish")) {
      await server.publishBundle(Project_ID, id, `${pkg.name}@${pkg.version}`);
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
        pkg.name
      );
      await server.apply(namespace.ID);
      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await server.assertOnlyOneTransaction(
        `[Namespace_ID] = ${Namespace_ID} AND (([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)`,
        pkg.name
      );
      await server.deploy(namespace.ID);
      lastSuccessfulStep = "deploy";
    }
  } catch (error) {
    error.lastSuccessfulStep = lastSuccessfulStep;
    throw error;
  }
}

async function publishFromDev() {
  await runStageOperations("dev.obet.no", ["publish", "generate", "deploy"]);
  await runStageOperations("stage.obet.no", ["download", "apply", "deploy"]);
  await runStageOperations("test.obet.no", ["download"]);
}

publishFromDev().catch((error) => {
  console.error(
    error.message,
    error.lastSuccessfulStep &&
      `(Last step completed: ${error.lastSuccessfulStep})`
  );
  process.exit(1);
});
