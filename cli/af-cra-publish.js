import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";

async function runStageOperations(
  devHost,
  operations = ["download"],
  { hostname, article: articleProp, version },
  state = {}
) {
  let lastSuccessfulStep = "none";
  try {
    let server = new Server(devHost);
    await server.login();
    lastSuccessfulStep = "login";

    let transactionName = `${hostname}/${articleProp}`;
    let article =
      state.article ?? (await server.getArticle(hostname, articleProp));
    lastSuccessfulStep = "getArticleInformation";

    state.article = article;

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
        "apply",
        transactionName,
        article.Namespace
      );
      await server.apply(article.Namespace_ID);
      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await server.assertOnlyOneTransaction(
        "deploy",
        transactionName,
        article.Namespace
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
  let config;
  if (articleWithHost) {
    let [hostname, article] = articleWithHost.split("/");
    config = {
      hostname,
      article,
      version,
    };

    if (!config.version) {
      let question = {
        type: "text",
        name: "version",
        message: "Enter a release description",
      };

      let answer = await prompts(question);
      config.version = answer.version;
    }
  } else {
    try {
      const pkg = await importJson("./package.json", true);
      config = { ...pkg.appframe, version: "v" + pkg.version };
    } catch (error) {
      console.log(
        chalk.red(
          "Failed to load article config. Either run the command from a folder with a CRA application with appframe config in package.json, or provide an argument with hostname and article ID."
        )
      );

      process.exit(0);
    }
  }

  let crossServerState = {};

  await runStageOperations(
    "dev.obet.no",
    ["publish", "generate", "deploy"],
    config,
    crossServerState
  );
  await runStageOperations(
    "stage.obet.no",
    ["download", "apply", "deploy"],
    config,
    crossServerState
  );
  await runStageOperations(
    "test.obet.no",
    ["download"],
    config,
    crossServerState
  );
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
