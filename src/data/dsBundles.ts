import { type Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export default (client: Client) =>
	generateApiDataHandler({
		client,
		resource: "sviw_Bundle_ProjectsVersions",
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
				nullable: false,
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
	});
