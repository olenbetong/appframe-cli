import { type Client, ProcedureAPI } from "@olenbetong/appframe-data";

export default (client: Client) =>
	new ProcedureAPI<{ Namespace_ID?: number }, unknown>({
		client,
		procedureId: "sstp_Deploy_Deploy",
		parameters: [{ name: "Namespace_ID" }],
	});
