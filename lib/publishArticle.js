import {
  dsArticlesVersions,
  dsTransactions,
  procCheckoutArticle,
  procPublishArticle,
} from "../data/index.js";

export async function publishArticle(hostname, articleId, version) {
  console.log("Checking out article...");
  await procCheckoutArticle.executeAsync({
    HostName: hostname,
    ArticleID: articleId,
    Forced: true,
  });

  dsArticlesVersions.setParameter(
    "whereClause",
    `[HostName] = '${hostname}' AND [ArticleId] LIKE '${articleId}.___'`
  );
  await dsArticlesVersions.refreshDataSource();

  dsTransactions.setParameter(
    "whereClause",
    `[Name] = '${hostname}/${articleId}'`
  );
  dsTransactions.setParameter("sortOrder", [{ Version: "desc" }]);
  await dsTransactions.refreshDataSource();

  // When we restore dev server, we sometimes get a mismatch between article versions
  // and transaction versions. To be able to generate a transaction, we have to publish
  // the app until the latest article version is higher than the latest transaction
  // version.
  if (
    dsTransactions.getDataLength() > 0 &&
    dsArticlesVersions.getDataLength() > 0
  ) {
    let transactionVersion = dsTransactions.getData(0, "Version");
    let articleVersion = Number(
      dsArticlesVersions.getData(0, "ArticleId").split(".")[1]
    );

    console.log(`Last published version: ${Number(articleVersion)}`);
    console.log(`Last transaction version: ${Number(transactionVersion)}`);

    while (articleVersion <= transactionVersion) {
      console.log(`Publishing app (v${version})...`);

      await procPublishArticle.execute({
        FromHostName: hostname,
        FromArticle: articleId,
        ToArticle: articleId,
        Description: "v" + version,
      });

      await dsArticlesVersions.refreshDataSource();
      articleVersion = Number(
        dsArticlesVersions.getData(0, "ArticleId").split(".")[1]
      );
    }
  } else {
    console.log(`Publishing app (v${version})...`);

    await procPublishArticle.execute({
      FromHostName: hostname,
      FromArticle: articleId,
      ToArticle: articleId,
      Description: "v" + version,
    });
  }
}
