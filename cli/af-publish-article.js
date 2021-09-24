import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";

const pkg = await importJson("./package.json", true);

async function runStageOperations(hostname, operations = ["download"]) {
  let lastSuccessfulStep = "none";
  try {
    let server = new Server(hostname);
    await server.login();
    lastSuccessfulStep = "login";

    let transactionName = `${pkg.appframe.hostname}/${pkg.appframe.article}`;
    let article = await server.getArticle(
      pkg.appframe.hostname,
      pkg.appframe.article
    );
    lastSuccessfulStep = "getArticleInformation";

    if (operations.includes("publish")) {
      await server.publishArticle(pkg.appframe.hostname, pkg.appframe.article);
      lastSuccessfulStep = "publish";
    }

    if (operations.includes("download")) {
      await server.download(article.Namespace);
      lastSuccessfulStep = "download";
    }

    if (operations.includes("generate")) {
      await server.generate(article.Namespace_ID);
      lastSuccessfulStep = "generate";
    }

    if (operations.includes("apply")) {
      await server.assertOnlyOneTransaction(
        `[Namespace_ID] = ${article.Namespace_ID} AND [Status] IN (0, 2, 4) AND [IsLocal] = 0`,
        transactionName
      );
      await server.apply(article.Namespace_ID);
      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await server.assertOnlyOneTransaction(
        `[Namespace_ID] = ${article.Namespace_ID} AND (([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)`,
        transactionName
      );
      await server.deploy(article.Namespace_ID);
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
