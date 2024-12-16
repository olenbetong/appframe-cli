import { copyFile } from "node:fs/promises";
import { getProjectFile } from "./getProjectFile.js";
import { getCLIFile } from "./getCLIFile.js";

export type TemplateDef = {
	title: string;
	source: string;
	target: string;
};

let templates: Record<string, TemplateDef> = {};
const templatesLoaded = false;

export async function getTemplate(templateName: string) {
	if (!templatesLoaded) {
		templates = (await import("../../templates/templates.js")).templates;
	}

	return templates[templateName];
}

export async function updateTemplateFile(templateName: string) {
	let template = await getTemplate(templateName);
	console.log(`Updating file from template: '${template.title}'...`);
	console.log(template);
	await copyFile(getCLIFile(template.source), getProjectFile(template.target));
}
