import { config } from "dotenv";
import * as af from "@olenbetong/data-object/node";

config({ path: process.cwd() + "/.env" });

const pkg = require("../package.json");
let { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

const procPublish = new af.ProcedureAPI({
  procedureId: "sstp_WebSiteCMS_CopyArticle",
});

const procDeploy = new af.Procedure({
  articleId: "af-updater",
  procedureId: "procDeploy",
});

const procGenerate = new af.Procedure({
  articleId: "af-updater",
  procedureId: "procGenerate",
});

const procApply = new af.Procedure({
  articleId: "af-updater",
  procedureId: "procApply",
});

const dsTransactions = af.generateApiDataObject({
  resource: "sviw_Deploy_Transactions",
  id: "dsTransactions",
  fields: ["ID", "Name", "Namespace_ID", "Description", "Status", "Version", "Type"],
});

const dsArticles = af.generateApiDataObject({
  resource: "sviw_WebSiteCMS_Articles",
  id: "dsArticles",
  fields: ["HostName", "ArticleId", "Namespace_ID", "Namespace"],
});

const dsArticlesVersions = af.generateApiDataObject({
  resource: "stbv_WebSiteCMS_ArticlesCheckInLog",
  id: "dsArticlesVersions",
  fields: ["HostName", "ArticleId"],
  parameters: {
    maxRecords: 1,
    sortOrder: [{ ArticleId: "desc" }],
  },
});

const procCheckoutArticle = new af.ProcedureAPI({
  procedureId: "sstp_WebSiteCMS_CheckOutArticle",
  fields: [{ name: "HostName" }, { name: "ArticleID" }, { name: "Forced" }],
});

async function checkOnlyOneTransaction(filter) {
  console.log("Getting transactions...");

  dsTransactions.setParameter("whereClause", filter);
  await dsTransactions.refreshDataSource();

  let transactions = dsTransactions.getDataLength();

  if (transactions > 1) {
    // Allow multiple transactions if they are all for the current article
    for (let record of dsTransactions.getData()) {
      if (record.Name !== `${pkg.appframe.hostname}/${pkg.appframe.article}` && record.Type !== 98) {
        console.table(dsTransactions.getData());
        throw Error("Found more than 1 transaction. Deploy have to be done manually.");
      }
    }
  } else if (transactions === 0) {
    throw Error("No transactions found. Check if there is a versioning problem with the article.");
  }
}

async function runStageOperations(hostname, operations = ["download"]) {
  let lastSuccessfulStep = "none";
  try {
    af.setHostname(hostname);
    console.log(`Logging in (${hostname}, user '${username}')...`);
    await af.login(username, password);
    lastSuccessfulStep = "login";

    console.log("Getting article information...");
    dsArticles.setParameter(
      "whereClause",
      `[HostName] = '${pkg.appframe.hostname}' AND [ArticleId] = '${pkg.appframe.article}  '`
    );
    await dsArticles.refreshDataSource();
    lastSuccessfulStep = "getArticleInformation";

    let article = dsArticles.getData(0);

    if (operations.includes("publish")) {
      console.log("Checking out article...");
      await procCheckoutArticle.executeAsync({
        HostName: pkg.appframe.hostname,
        ArticleID: pkg.appframe.article,
        Forced: true,
      });

      lastSuccessfulStep = "checkout";

      dsArticlesVersions.setParameter(
        "whereClause",
        `[HostName] = '${pkg.appframe.hostname}' AND [ArticleId] LIKE '${pkg.appframe.article}.___'`
      );
      await dsArticlesVersions.refreshDataSource();

      dsTransactions.setParameter("whereClause", `[Name] = '${pkg.appframe.hostname}/${pkg.appframe.article}'`);
      dsTransactions.setParameter("sortOrder", [{ Version: "desc" }]);
      await dsTransactions.refreshDataSource();

      // When we restore dev server, we sometimes get a mismatch between article versions
      // and transaction versions. To be able to generate a transaction, we have to publish
      // the app until the latest article version is higher than the latest transaction
      // version.
      if (dsTransactions.getDataLength() > 0 && dsArticlesVersions.getDataLength() > 0) {
        let transactionVersion = dsTransactions.getData(0, "Version");
        let articleVersion = Number(dsArticlesVersions.getData(0, "ArticleId").split(".")[1]);

        console.log(`Last published version: ${Number(articleVersion)}`);
        console.log(`Last transaction version: ${Number(transactionVersion)}`);

        let publishCount = 0;
        while (articleVersion <= transactionVersion) {
          console.log(`Publishing app (v${pkg.version})...`);

          await procPublish.execute({
            FromHostName: pkg.appframe.hostname,
            FromArticle: pkg.appframe.article,
            ToArticle: pkg.appframe.article,
            Description: "v" + pkg.version,
          });

          await dsArticlesVersions.refreshDataSource();
          articleVersion = Number(dsArticlesVersions.getData(0, "ArticleId").split(".")[1]);

          lastSuccessfulStep = `publish(${publishCount})`;
        }
      } else {
        console.log(`Publishing app (v${pkg.version})...`);

        await procPublish.execute({
          FromHostName: pkg.appframe.hostname,
          FromArticle: pkg.appframe.article,
          ToArticle: pkg.appframe.article,
          Description: "v" + pkg.version,
        });

        lastSuccessfulStep = "publish";
      }
    }

    if (operations.includes("download")) {
      console.log("Downloading updates...");

      let result = await af.afFetch(`/api/ob-deploy/download/1/${article.Namespace}`, {
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
      await procGenerate.execute({ Namespace_ID: article.Namespace_ID });

      lastSuccessfulStep = "generate";
    }

    if (operations.includes("apply")) {
      await checkOnlyOneTransaction(
        `[Namespace_ID] = ${article.Namespace_ID} AND [Status] IN (0, 2, 4) AND [IsLocal] = 0`
      );
      console.log("Applying update...");
      await procApply.execute({ Namespaces: String(article.Namespace_ID) });

      lastSuccessfulStep = "apply";
    }

    if (operations.includes("deploy")) {
      await checkOnlyOneTransaction(
        `[Namespace_ID] = ${article.Namespace_ID} AND (([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)`
      );
      console.log("Deploying...");
      await procDeploy.execute({ Namespace_ID: article.Namespace_ID });

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
  console.error(error.message, error.lastSuccessfulStep && `(Last step completed: ${error.lastSuccessfulStep})`);
  process.exit(1);
});
