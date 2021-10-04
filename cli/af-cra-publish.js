import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import { Command } from "commander";

const pkg = await importJson("./package.json", true);

async function runStageOperations(
  devHost,
  operations = ["download"],
  { hostname, article: articleProp, version }
) {
  let lastSuccessfulStep = "none";
  try {
    let server = new Server(devHost);
    await server.login();
    lastSuccessfulStep = "login";

    let transactionName = `${hostname}/${articleProp}`;
    let article = await server.getArticle(hostname, articleProp);
    lastSuccessfulStep = "getArticleInformation";

    if (operations.includes("publish")) {
      await server.publishArticle(hostname, articleProp, version);
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

async function publishFromDev(articleWithHost, version) {
  let config = { ...pkg.appframe, version: "v" + pkg.version };
  if (articleWithHost) {
    let [hostname, article] = articleWithHost.split("/");
    config = {
      hostname,
      article,
      version,
    };
  }

  await runStageOperations(
    "dev.obet.no",
    ["publish", "generate", "deploy"],
    config
  );
  await runStageOperations(
    "stage.obet.no",
    ["download", "apply", "deploy"],
    config
  );
  await runStageOperations("test.obet.no", ["download"], config);
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .argument(
    "[article-with-hostname]",
    "Select article and hostname to publish (ex. synergi.olenbetong.no/portal). Will look for a CRA config in package.json if undefined"
  )
  .argument(
    "[description]",
    "Description to set in the version notes. Only used if article-with-hostname is set"
  )
  .action(publishFromDev);

await program.parseAsync(process.argv);
