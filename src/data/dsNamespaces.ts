import { Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataHandler({
    client,
    resource: "sviw_Deploy_NamespacesWithGroupNames",
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
  });
