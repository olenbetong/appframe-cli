import { Client, ProcedureAPI } from "@olenbetong/appframe-data";

export type PublishBundleParams = {
	project_id?: string;
	ver_id?: string;
	DESCription?: string;
	issueid?: string;
};

export default (client: Client) =>
	new ProcedureAPI<PublishBundleParams, unknown>({
		client,
		procedureId: "sstp_Bundle_ToProduction",
		parameters: [
			{
				name: "project_id",
				type: "string",
				hasDefault: false,
				required: false,
			},
			{
				name: "ver_id",
				type: "string",
				hasDefault: false,
				required: false,
			},
			{
				name: "DESCription",
				type: "string",
				hasDefault: false,
				required: false,
			},
			{
				name: "issueid",
				type: "string",
				hasDefault: false,
				required: false,
			},
		],
	});
