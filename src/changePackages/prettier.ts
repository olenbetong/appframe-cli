import { satisfies } from "compare-versions";
import { fileExists } from "../lib/fileExists.js";
import { getTemplate, updateTemplateFile } from "../lib/updateTemplateFile.js";
import { importJson } from "../lib/importJson.js";
import { installPackage } from "../lib/installPackage.js";

export const name = "Prettier configuration";
export const cliVersion = "3.53.0";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let prettierConfigTemplate = await getTemplate("prettier-config");
	let hasPrettierConfig = await fileExists(prettierConfigTemplate.target, true);
	let prettierVersion = pkg.devDependencies?.prettier ?? pkg.dependencies?.prettier ?? "0.0.0";
	let hasUpdatedPrettier = satisfies(prettierVersion, "^3.0.0");

	return !hasPrettierConfig || !hasUpdatedPrettier;
}

export async function execute() {
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let devPackagesToInstallOrUpdate: string[] = ["prettier", "@trivago/prettier-plugin-sort-imports"];

	await installPackage(devPackagesToInstallOrUpdate, {
		isDev: true,
		updateIfExists: true,
		dependencies,
	});

	await updateTemplateFile("prettier-config");
}
