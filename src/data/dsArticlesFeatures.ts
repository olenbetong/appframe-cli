import { type Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export type ArticlesFeaturesRecord = Readonly<{
	HostName: string;
	ArticleId: string;
	Namespace_ID: number | null;
	Namespace: string;
	Feature_ID: number;
	Key: string;
	Name: string;
	Description: string | null;
}>;

export default (client: Client) =>
	generateApiDataHandler<ArticlesFeaturesRecord>({
		client,
		resource: "aviw_FeatureMgmt_ArticlesFeatures",
		fields: [
			{
				name: "HostName",
				type: "string",
				nullable: false,
			},
			{
				name: "ArticleId",
				type: "string",
				nullable: false,
			},
			{
				name: "Namespace_ID",
				type: "number",
				nullable: true,
			},
			{
				name: "Namespace",
				type: "string",
				nullable: false,
			},
			{
				name: "Feature_ID",
				type: "number",
				nullable: false,
			},
			{
				name: "Key",
				type: "string",
				nullable: false,
			},
			{
				name: "Name",
				type: "string",
				nullable: false,
			},
			{
				name: "Description",
				type: "string",
				nullable: true,
			},
		],
	});
