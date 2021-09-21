import { generateApiDataObject } from "@olenbetong/data-object/node";

const dsTransactions = generateApiDataObject({
  resource: "sviw_Deploy_Transactions",
  id: "dsTransactions",
  fields: [
    "ID",
    "Name",
    "Namespace_ID",
    "Description",
    "Status",
    "Version",
    "Type",
  ],
});

export default dsTransactions;
