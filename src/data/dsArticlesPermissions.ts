import { type Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
	generateApiDataHandler({
		client,
		resource: "stbv_WebSiteCMS_ArticlesPermissions",
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
	});
