import { Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
	generateApiDataHandler({
		client,
		resource: "stbv_WebSiteCMS_Templates",
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
				name: "HostName",
				type: "string",
				nullable: false,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "TemplateID",
				type: "string",
				nullable: false,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "HTMLTemplate",
				type: "string",
				nullable: true,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "HTMLTemplateTest",
				type: "string",
				nullable: true,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "Hidden",
				type: "boolean",
				nullable: false,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "ProcessingMode",
				type: "string",
				nullable: false,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "SysTemplate",
				type: "boolean",
				nullable: false,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "Span",
				type: "string",
				nullable: true,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "Description",
				type: "string",
				nullable: true,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "UseInArticle",
				type: "boolean",
				nullable: false,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "ClientLib",
				type: "string",
				nullable: true,
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "SearchColumn",
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
				computed: false,
				identity: false,
				hasDefault: false,
			},
			{
				name: "CheckedOutBy",
				type: "string",
				nullable: true,
				computed: false,
				identity: false,
				hasDefault: false,
			},
		],
	});
