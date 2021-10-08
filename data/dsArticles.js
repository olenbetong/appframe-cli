import { generateApiDataObject } from "@olenbetong/data-object/node";

export default (client) =>
  generateApiDataObject({
    resource: "sviw_WebSiteCMS_Articles",
    id: "dsArticles",
    fields: ["HostName", "ArticleId", "Namespace_ID", "Namespace"],
    client,
  });
