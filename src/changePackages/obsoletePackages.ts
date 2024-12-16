import { importJson } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";

export const name = "Remove obsolete packages";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let packages = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));

	return packages.find((p) => p === "react-router-typesafe" || p === "@types/react-helmet" || p === "react-helmet");
}

export async function execute() {
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let packagesToRemove: string[] = ["react-router-typesafe", "@types/react-helmet", "react-helmet"];

	await removePackageIfExists(packagesToRemove, dependencies);
}
