import { generateApiDataObject } from "@olenbetong/data-object";

export default (client) =>
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
