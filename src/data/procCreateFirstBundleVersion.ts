import { Client, ProcedureAPI } from "@olenbetong/appframe-data";

export default (client: Client) =>
	new ProcedureAPI({
		client,
		procedureId: "sstp_Bundle_CreateFirstVersion",
		parameters: [
			{
				name: "project_id",
				hasDefault: false,
				required: false,
			},
		],
	});
