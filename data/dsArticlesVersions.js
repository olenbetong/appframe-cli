import { generateApiDataObject } from "@olenbetong/data-object/node";

const dsArticlesVersions = generateApiDataObject({
  resource: "stbv_WebSiteCMS_ArticlesCheckInLog",
  id: "dsArticlesVersions",
  fields: ["HostName", "ArticleId"],
  parameters: {
    maxRecords: 1,
    sortOrder: [{ ArticleId: "desc" }],
  },
});

export default dsArticlesVersions;
