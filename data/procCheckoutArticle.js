import { ProcedureAPI } from "@olenbetong/data-object";

export default (client) =>
  new ProcedureAPI({
    client,
    procedureId: "sstp_WebSiteCMS_CheckOutArticle",
    fields: [{ name: "HostName" }, { name: "ArticleID" }, { name: "Forced" }],
  });
