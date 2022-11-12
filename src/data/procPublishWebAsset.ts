import { Client, ProcedureAPI } from "@olenbetong/appframe-data";

export type PublishWebAssetsParams = {
  Hostname?: string;
  Name?: string;
  Type?: string;
  Description?: string;
  IssueID?: string;
};

export default (client: Client) =>
  new ProcedureAPI<PublishWebAssetsParams, unknown>({
    client,
    procedureId: "sstp_WebSiteCMS_PublishWebAsset",
    parameters: [
      {
        name: "Hostname",
        type: "string",
        hasDefault: false,
        required: false,
      },
      {
        name: "Name",
        type: "string",
        hasDefault: false,
        required: false,
      },
      {
        name: "Type",
        type: "string",
        hasDefault: false,
        required: false,
      },
      {
        name: "Description",
        type: "string",
        hasDefault: false,
        required: false,
      },
      {
        name: "IssueID",
        type: "string",
        hasDefault: false,
        required: false,
      },
    ],
    timeout: 30000,
  });
