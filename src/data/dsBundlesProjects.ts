import { Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
  generateApiDataHandler({
    client,
    resource: "stbv_Bundle_Projects",
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
