import { config } from "dotenv";
import { afFetch, login, setHostname } from "@olenbetong/data-object/node";
import {
  dsNamespaces,
  procApply,
  procDeploy,
  procGenerate,
} from "../data/index.js";
import { Command } from "commander";

config({ path: process.cwd() + "/.env" });
let { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

async function runStageOperations(
  namespace,
  hostname,
  operations = ["download"]
) {
  let lastSuccessfulStep = "none";
  try {
    setHostname(hostname);
    console.log(`Logging in (${hostname}, user '${username}')...`);
    await login(username, password);
    lastSuccessfulStep = "login";

    console.log("Getting namespace information...");
    dsNamespaces.setParameter("whereClause", `[Name] = '${namespace}'`);
    await dsNamespaces.refreshDataSource();

    let record = dsNamespaces.getData(0);

    lastSuccessfulStep = "getArticleInformation";

    if (operations.includes("download")) {
      console.log("Downloading updates...");

      let result = await afFetch(`/api/ob-deploy/download/1/${record.Name}`, {
        method: "POST",
      });

      if (result.headers.get("Content-Type")?.includes("json")) {
        let data = await result.json();

        if (data?.error) {
          throw Error(data.error);
        }
      }

      if (!result.ok) {
        throw Error(`${result.status} ${result.statusTest}`);
      }

      lastSuccessfulStep = "download";
    }

    if (operations.includes("generate")) {
      console.log("Generating transactions...");
      await procGenerate.execute({ Namespace_ID: record.ID });

      lastSuccessfulStep = "generate";
    }

    if (operations.includes("apply")) {
      console.log("Applying update...");
      await procApply.execute({ Namespaces: String(record.ID) });

      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      console.log("Deploying...");
      await procDeploy.execute({ Namespace_ID: record.ID });

      lastSuccessfulStep = "deploy";
    }
  } catch (error) {
    error.lastSuccessfulStep = lastSuccessfulStep;
    throw error;
  }
}

async function publishFromDev(namespace) {
  await runStageOperations(namespace, "dev.obet.no", [
    "publish",
    "generate",
    "deploy",
  ]);
  await runStageOperations(namespace, "stage.obet.no", [
    "download",
    "apply",
    "deploy",
  ]);
  await runStageOperations(namespace, "test.obet.no", ["download"]);
}

async function run(namespace) {
  try {
    await publishFromDev(namespace);
  } catch (error) {
    console.error(
      error.message,
      error.lastSuccessfulStep &&
        `(Last step completed: ${error.lastSuccessfulStep})`
    );
    process.exit(1);
  }
}

const program = new Command();
program
  .version("1.0.0")
  .argument("<namespace>", "namespace to push from dev to production")
  .action(run);

await program.parseAsync(process.argv);
