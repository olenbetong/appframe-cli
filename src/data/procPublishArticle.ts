import { Client, ProcedureAPI } from "@olenbetong/appframe-data";

export default (client: Client) => new ProcedureAPI({ client, procedureId: "sstp_WebSiteCMS_CopyArticle" });
