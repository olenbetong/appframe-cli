import { satisfies } from "compare-versions";
import { importJson } from "../lib/importJson.js";
import { fileExists } from "../lib/fileExists.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import { removeFileIfExists } from "../lib/removeFileIfExists.js";
import { updateTemplateFile } from "../lib/updateTemplateFile.js";
import { installPackage } from "../lib/installPackage.js";

export const name = "Update ESLint configuration";
export const cliVersion = "3.53.0";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let packages = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let eslintVersion = pkg.devDependencies?.eslint ?? pkg.dependencies?.eslint ?? "0.0.0";
	let hasLegacyEslintConfig = await fileExists(".eslintrc.js");

	if (!satisfies(eslintVersion, "^9.0.0") || hasLegacyEslintConfig) {
		return true;
	} else if (
		packages.find((p) => p.startsWith("@typescript-eslint")) ||
		packages.find((p) => p.startsWith("eslint-"))
	) {
		return true;
	}

	return false;
}

export async function execute() {
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let packagesToRemove: string[] = [
		"@typescript-eslint/eslint-plugin",
		"@typescript-eslint/parser",
		"eslint-config-prettier",
		"eslint-plugin-react",
	];

	await removePackageIfExists(packagesToRemove, dependencies);

	let devPackagesToInstallOrUpdate: string[] = ["eslint", "@olenbetong/eslint-config"];

	await removeFileIfExists("./.eslintrc.js");
	await updateTemplateFile("eslint-config");

	await installPackage(devPackagesToInstallOrUpdate, {
		isDev: true,
		updateIfExists: true,
		dependencies,
	});
}
