import { generateApiDataObject } from "@olenbetong/data-object";

export default (client) =>
  generateApiDataObject({
    client,
    resource: "sviw_Bundle_ProjectsVersions",
    id: "dsBundles",
    fields: [
      {
        name: "ID",
        type: "number",
        nullable: false,
        computed: false,
        identity: true,
        hasDefault: true,
      },
      {
        name: "Project_ID",
        type: "number",
        nullable: false,
        computed: false,
        identity: false,
        hasDefault: false,
      },
      {
        name: "Version",
        type: "number",
        nullsable: false,
        computed: false,
        identity: false,
        hasDefault: false,
      },
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
        nullable: true,
        computed: true,
        identity: false,
        hasDefault: false,
      },
    ],
    parameters: {
      maxRecords: 50,
    },
  });
