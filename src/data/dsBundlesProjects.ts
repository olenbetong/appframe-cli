import { Client, generateApiDataObject } from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataObject({
    client,
    resource: "stbv_Bundle_Projects",
    allowInsert: true,
    id: "dsBundlesProjects",
    fields: [
      {
        name: "Name",
        type: "string",
        nullable: false,
        computed: false,
        identity: false,
        hasDefault: false,
      },
      {
        name: "Namespace_ID",
        type: "number",
        nullable: false,
        computed: false,
        identity: false,
        hasDefault: false,
      },
      {
        name: "ID",
        type: "number",
        nullable: false,
        computed: false,
        identity: true,
        hasDefault: false,
      },
    ],
  });
