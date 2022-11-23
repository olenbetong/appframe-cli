import {
  Client,
  generateApiDataHandler,
  generateApiDataObject,
} from "@olenbetong/appframe-data";

export type DataResourcesParametersRecord = {
  DBObjectID: string;
  Name: string | null;
  DataType: string | null;
  MaxLength: number | null;
  HasDefault: boolean | null;
  FieldOrder: number | null;
  Nullable: boolean | null;
  Computed: boolean | null;
  Identity: boolean | null;
  ValueListRecordSource: string | null;
  ValueListValueMember: string | null;
  ExcludeFromFilter: boolean | null;
};

export default (client: Client) =>
  generateApiDataHandler<DataResourcesParametersRecord>({
    client,
    resource: "sviw_WebSiteCMS_DataResourcesParameters",
    fields: [
      {
        name: "DBObjectID",
        type: "string",
        nullable: false,
        hasDefault: false,
      },
      {
        name: "Name",
        type: "string",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "DataType",
        type: "string",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "MaxLength",
        type: "number",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "HasDefault",
        type: "boolean",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "FieldOrder",
        type: "number",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "Nullable",
        type: "boolean",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "Computed",
        type: "boolean",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "Identity",
        type: "boolean",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "ValueListRecordSource",
        type: "string",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "ValueListValueMember",
        type: "string",
        nullable: true,
        hasDefault: false,
      },
      {
        name: "ExcludeFromFilter",
        type: "boolean",
        nullable: true,
        hasDefault: false,
      },
    ],
  });
