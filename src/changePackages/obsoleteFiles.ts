import { fileExists } from "../lib/fileExists.js";
import { removeFileIfExists } from "../lib/removeFileIfExists.js";

export const name = "Remove obsolete files";
export const cliVersion = "3.53.0";

export async function check() {
	let hasServerFile = await fileExists("./server.mjs", true);
	let hasIndexHtml = await fileExists("./index.html", true);
	let hasPublishAndDeployAction = await fileExists("./.github/workflows/publish-and-deploy.yml", true);

	return hasServerFile || hasIndexHtml || hasPublishAndDeployAction;
}

export async function execute() {
	await removeFileIfExists("./server.mjs");
	await removeFileIfExists("./index.html");
	await removeFileIfExists("./.github/workflows/publish-and-deploy.yml");
}
