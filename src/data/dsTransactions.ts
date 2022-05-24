import { Client, generateApiDataObject } from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataObject({
    client,
    resource: "sviw_Deploy_Transactions",
    id: "dsTransactions",
    parameters: {
      maxRecords: -1,
    },
    fields: [
      "ID",
      "Name",
      "Namespace_ID",
      "Namespace",
      "Description",
      "Status",
      "Version",
      "Type",
      "LocalCreatedBy",
      "CreatedBy",
      "CreatedByName",
    ],
  });
