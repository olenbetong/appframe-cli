import { Client, ProcedureAPI } from "@olenbetong/data-object";

export default (client: Client) =>
  new ProcedureAPI({
    client,
    procedureId: "sstp_Bundle_CreateFirstVersion",
    parameters: [
      {
        name: "project_id",
        hasDefault: false,
        required: false,
      },
    ],
  });
