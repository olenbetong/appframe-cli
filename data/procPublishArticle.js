import { ProcedureAPI } from "@olenbetong/data-object/node";

export default (client) =>
  new ProcedureAPI({ client, procedureId: "sstp_WebSiteCMS_CopyArticle" });
