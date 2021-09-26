import { generateApiDataObject } from "@olenbetong/data-object/node";

const dsDataResources = generateApiDataObject({
  resource: "API_Resources",
  id: "dsDataResources",
  allowInsert: true,
  allowDelete: true,
  fields: [
    {
      name: "PrimKey",
      type: "string",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "Created",
      type: "datetime",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "CreatedBy",
      type: "string",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "Updated",
      type: "datetime",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "UpdatedBy",
      type: "string",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "CUT",
      type: "boolean",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "CDL",
      type: "boolean",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "DBObjectID",
      type: "string",
      nullable: false,
      computed: false,
      identity: false,
      hasDefault: false,
    },
    {
      name: "Name",
      type: "string",
      nullable: true,
      computed: false,
      identity: false,
      hasDefault: false,
    },
  ],
  parameters: {
    maxRecords: 50,
  },
});

export default dsDataResources;
