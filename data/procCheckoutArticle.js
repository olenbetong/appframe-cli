import { ProcedureAPI } from "@olenbetong/data-object/node";

export default (client) =>
  new ProcedureAPI({
    client,
    procedureId: "sstp_WebSiteCMS_CheckOutArticle",
    fields: [{ name: "HostName" }, { name: "ArticleID" }, { name: "Forced" }],
  });
