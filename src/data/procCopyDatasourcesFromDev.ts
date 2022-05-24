import { Client, ProcedureAPI } from "@olenbetong/appframe-data";

export default (client: Client) =>
  new ProcedureAPI({
    client,
    procedureId: "astp_WebShared_CopyDatasourcesFromDev",
    parameters: [
      {
        name: "Hostname",
        type: "string",
        hasDefault: false,
        required: false,
      },
      {
        name: "ArticleId",
        type: "string",
        hasDefault: false,
        required: false,
      },
    ],
    timeout: 30000,
  });
