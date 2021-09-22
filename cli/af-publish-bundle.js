import { config } from "dotenv";

import { afFetch, login, setHostname } from "@olenbetong/data-object/node";

import {
  dsNamespaces,
  procApply,
  procDeploy,
  procGenerate,
  procPublishBundle,
} from "../data/index.js";
import { dsBundles } from "../data/index.js";
import { importJson } from "../lib/importJson.js";
import { checkOnlyOneTransaction } from "../lib/checkOnlyOneTransaction.js";

config({ path: process.cwd() + "/.env" });

const pkg = await importJson("./package.json", true);
let { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

async function runStageOperations(hostname, operations = ["download"]) {
  let lastSuccessfulStep = "none";
  try {
    setHostname(hostname);
    console.log(`Logging in (${hostname}, user '${username}')...`);
    await login(username, password);
    lastSuccessfulStep = "login";

    console.log("Getting bundle information...");
    dsBundles.setParameter(
      "whereClause",
      `[Name] = '${pkg.name}' AND [Version] = 0`
    );
    await dsBundles.refreshDataSource();

    let {
      ID: id,
      Project_ID,
      Name,
      Namespace_ID,
    } = dsBundles.getDataLength() > 0 ? dsBundles.getData(0) : {};

    if (id) {
      if (!Namespace_ID) {
        throw Error(`Bundle '${pkg.name}' is not assigned to a namespace`);
      }

      dsNamespaces.setParameter("whereClause", `[ID] = ${Namespace_ID}`);
      console.log("Getting namespace...");
      await dsNamespaces.refreshDataSource();

      let namespace = dsNamespaces.getData(0, "Name");

      console.log(
        `Found bundle '${Name}' with Namespace/Project/Version: ${namespace}/${id}/${Project_ID}`
      );
    } else {
      throw Error(`No bundle with name '${pkg.name}' found`);
    }

    lastSuccessfulStep = "getBundleInformation";

    if (operations.includes("publish")) {
      console.log("Publishing...");
      await procPublishBundle.executeAsync({
        description: "v" + pkg.version,
        issueid: null,
        project_id: Project_ID,
        ver_id: id,
      });

      lastSuccessfulStep = "publish";
    }

    if (operations.includes("download")) {
      console.log("Downloading updates...");

      let namespace = dsNamespaces.getData(0, "Name");
      let result = await afFetch(`/api/ob-deploy/download/1/${namespace}`, {
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
      await procGenerate.execute({ Namespace_ID });

      lastSuccessfulStep = "generate";
    }

    if (operations.includes("apply")) {
      await checkOnlyOneTransaction(
        `[Namespace_ID] = ${Namespace_ID} AND [Status] IN (0, 2, 4) AND [IsLocal] = 0`,
        pkg.name
      );
      console.log("Applying update...");
      await procApply.execute({ Namespaces: String(Namespace_ID) });

      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await checkOnlyOneTransaction(
        `[Namespace_ID] = ${Namespace_ID} AND (([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)`,
        pkg.name
      );
      console.log("Deploying...");
      await procDeploy.execute({ Namespace_ID });

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
