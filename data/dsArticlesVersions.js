import { generateApiDataObject } from "@olenbetong/data-object";

export default (client) =>
  generateApiDataObject({
    resource: "stbv_WebSiteCMS_ArticlesCheckInLog",
    id: "dsArticlesVersions",
    client,
    fields: ["HostName", "ArticleId"],
    parameters: {
      maxRecords: 1,
      sortOrder: [{ ArticleId: "desc" }],
    },
  });
