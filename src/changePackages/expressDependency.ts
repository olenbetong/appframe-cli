import { importJson } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import type { Codemod } from "../lib/applyCodemod.js";

export const name = "Remove express";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let packages = Object.keys(pkg.optionalDependencies ?? {})
		.concat(Object.keys(pkg.dependencies ?? {}))
		.concat(Object.keys(pkg.devDependencies ?? {}));

	return Boolean(packages.find((p) => p === "express"));
}

export async function execute() {
	let pkg = await importJson("./package.json", true);
	let packages = Object.keys(pkg.optionalDependencies ?? {})
		.concat(Object.keys(pkg.dependencies ?? {}))
		.concat(Object.keys(pkg.devDependencies ?? {}));

	await removePackageIfExists(["express"], packages);
}
