import { generateApiDataObject } from "@olenbetong/data-object/node";

const dsArticles = generateApiDataObject({
  resource: "sviw_WebSiteCMS_Articles",
  id: "dsArticles",
  fields: ["HostName", "ArticleId", "Namespace_ID", "Namespace"],
});

export default dsArticles;
