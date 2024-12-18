import { fileExists } from "../lib/fileExists.js";
import { getTemplate, updateTemplateFile } from "../lib/updateTemplateFile.js";
import { ensureProjectFolderExists } from "../lib/ensureProjectFolderExists.js";

export const name = "Update configuration files";
export const cliVersion = "3.53.0";

export async function check() {
	let workflow = await getTemplate("workflow-build-and-deploy");
	let vsCodeSettings = await getTemplate("vs-code-settings");
	let hasWorkflows = await fileExists(workflow.target, true);
	let hasVsCodeSettings = await fileExists(vsCodeSettings.target, true);

	return !hasWorkflows || !hasVsCodeSettings;
}

export async function execute() {
	await ensureProjectFolderExists("./.github/workflows");
	await ensureProjectFolderExists("./.vscode");

	await updateTemplateFile("workflow-build-and-deploy");
	await updateTemplateFile("vs-code-settings");
}
