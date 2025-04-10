import { importJson } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import { installPackage } from "../lib/installPackage.js";
import { removeFileIfExists } from "../lib/removeFileIfExists.js";
import { execShellCommand, spawnShellCommand } from "../lib/execShellCommand.js";
import { updateTemplateFile } from "../lib/updateTemplateFile.js";
import { fileExists } from "../lib/fileExists.js";

export const name = "Migrate from ESLint and Prettier to Biome";
export const cliVersion = "3.57.0";

export async function check() {
	// Check if ESLint or Prettier are installed
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let hasEslint = dependencies.includes("eslint");
	let hasPrettier = dependencies.includes("prettier");

	return (
		hasEslint ||
		hasPrettier ||
		fileExists(".eslintrc", true) ||
		fileExists(".eslintrc.json", true) ||
		fileExists(".prettierrc", true)
	);
}

export async function execute() {
	// Check if ESLint or Prettier are installed
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));

	await removePackageIfExists(
		[
			"eslint",
			"prettier",
			"@olenbetong/eslint",
			"@trivago/prettier-plugin-sort-imports",
			"@typescript-eslint/eslint-plugin",
			"@typescript-eslint/parser",
			"eslint-config-prettier",
			"eslint-plugin-react",
		],
		dependencies,
	);
	await removeFileIfExists([".eslintrc", ".eslintrc.json", ".prettierrc"]);
	await installPackage(["@biomejs/biome"], {
		isDev: true,
		updateIfExists: false,
		dependencies,
	});

	await spawnShellCommand("pnpm", ["approve-builds"]);
	await execShellCommand("pnpm biome lint ./src --fix --unsafe || true");
	await updateTemplateFile("vs-code-settings");
}
