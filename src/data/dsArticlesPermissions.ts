import { Client, generateApiDataObject } from "@olenbetong/data-object";

export default (client: Client) =>
  generateApiDataObject({
    client,
    resource: "stbv_WebSiteCMS_ArticlesPermissions",
    id: "dsArticlesPermissions",
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      {
        name: "PrimKey",
        type: "string",
      },
      {
        name: "Created",
        type: "datetime",
      },
      {
        name: "CreatedBy",
        type: "string",
      },
      {
        name: "Updated",
        type: "datetime",
      },
      {
        name: "UpdatedBy",
        type: "string",
      },
      {
        name: "HostName",
        type: "string",
      },
      {
        name: "ArticleID",
        type: "string",
      },
      {
        name: "RoleID",
        type: "number",
      },
    ],
    parameters: {
      maxRecords: -1,
    },
  });
