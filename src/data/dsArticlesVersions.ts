import {
  Client,
  generateApiDataHandler,
  SortOrder,
} from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataHandler({
    resource: "stbv_WebSiteCMS_ArticlesCheckInLog",
    client,
    fields: ["HostName", "ArticleId"],
  });
