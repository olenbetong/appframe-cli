import { type Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
	generateApiDataHandler({
		client,
		resource: "sviw_Deploy_Transactions",
		fields: [
			"ID",
			"Name",
			"Namespace_ID",
			"Namespace",
			"Description",
			"Status",
			"Version",
			"Type",
			"LocalCreatedBy",
			"CreatedBy",
			"CreatedByName",
			"LastError",
		],
	});
