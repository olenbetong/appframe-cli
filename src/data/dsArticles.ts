import { Client, generateApiDataObject } from "@olenbetong/data-object";

export default (client: Client) =>
  generateApiDataObject({
    resource: "sviw_WebSiteCMS_Articles",
    id: "dsArticles",
    fields: ["HostName", "ArticleId", "Namespace_ID", "Namespace"],
    client,
  });
