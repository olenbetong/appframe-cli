import { Client, generateApiDataObject } from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataObject({
    client,
    resource: "sviw_Deploy_NamespacesWithGroupNames",
    id: "dsSomeDataObjectID",
    allowUpdate: false,
    allowInsert: false,
    allowDelete: false,
    fields: [
      {
        name: "PrimKey",
        type: "string",
        nullable: false,
        hasDefault: false,
      },
      {
        name: "Name",
        type: "string",
        nullable: false,
        hasDefault: false,
      },
      {
        name: "ID",
        type: "number",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "GroupName",
        type: "string",
        nullable: true,
        hasDefault: false,
      },
    ],
    parameters: {
      maxRecords: -1,
      sort: [{ GroupName: "asc", Name: "asc" }],
    },
  });
