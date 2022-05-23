import { Client, ProcedureAPI } from "@olenbetong/data-object";

export default (client: Client) =>
  new ProcedureAPI<any, any>({
    client,
    procedureId: "sstp_WebSiteCMS_PublishWebAsset",
    parameters: [
      {
        name: "Hostname",
        hasDefault: false,
        required: false,
      },
      {
        name: "Name",
        hasDefault: false,
        required: false,
      },
      {
        name: "Type",
        hasDefault: false,
        required: false,
      },
      {
        name: "Description",
        hasDefault: false,
        required: false,
      },
      {
        name: "IssueID",
        hasDefault: false,
        required: false,
      },
    ],
    timeout: 30000,
  });
