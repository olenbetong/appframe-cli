import { type Client, ProcedureAPI } from "@olenbetong/appframe-data";

export default (client: Client) =>
	new ProcedureAPI<{ BatchsSize?: number; Namespaces: string }, unknown>({
		client,
		procedureId: "sstp_Deploy_Apply",
		parameters: [{ name: "BatchsSize" }, { name: "Namespaces" }],
		transaction: false,
	});
