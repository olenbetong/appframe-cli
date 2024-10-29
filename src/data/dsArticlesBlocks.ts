import { Client, generateApiDataHandler } from "@olenbetong/appframe-data";

export type ArticlesBlockRecord = Readonly<{
	PrimKey: string;
	HtmlContent: string;
	HostName: string;
	ArticleId: string;
	ID: string;
}>;

export default (client: Client) =>
	generateApiDataHandler<ArticlesBlockRecord>({
		client,
		resource: "stbv_WebSiteCMS_HtmlBlocks",
		fields: [
			{ name: "PrimKey", type: "string", nullable: false },
			{ name: "HostName", type: "string", nullable: false },
			{ name: "ArticleId", type: "string", nullable: false },
			{ name: "ID", type: "string", nullable: false },
			{ name: "HtmlContent", type: "string", nullable: true },
		],
	});
