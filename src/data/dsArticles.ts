import { Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataHandler({
    resource: "sviw_WebSiteCMS_Articles",
    fields: ["HostName", "ArticleId", "Namespace_ID", "Namespace"],
    client,
  });
