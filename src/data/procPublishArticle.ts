import { Client, ProcedureAPI } from "@olenbetong/data-object";

export default (client: Client) =>
  new ProcedureAPI({ client, procedureId: "sstp_WebSiteCMS_CopyArticle" });