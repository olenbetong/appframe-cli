import { generateApiDataObject } from "@olenbetong/data-object";

export default (client) =>
  generateApiDataObject({
    client,
    resource: "sviw_Deploy_Transactions",
    id: "dsTransactions",
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
