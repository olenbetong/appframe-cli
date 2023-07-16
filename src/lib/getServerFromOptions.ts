import prompts, { PromptObject } from "prompts";

export async function getServerFromOptions(options: {
	server?: string | undefined;
}) {
	if (options.server) return;

	let question: PromptObject<"server"> = {
		type: "select",
		name: "server",
		message: "Select server to connect to",
		choices: [
			{ title: "dev.obet.no", value: "dev.obet.no" },
			{ title: "stage.obet.no", value: "stage.obet.no" },
			{ title: "test.obet.no", value: "test.obet.no" },
		],
		onState: (state) => {
			if (state.aborted) {
				process.nextTick(() => {
					process.exit(0);
				});
			}
		},
	};

	let response = await prompts(question);

	options.server = response.server;
}
