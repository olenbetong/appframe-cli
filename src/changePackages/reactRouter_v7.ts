import { importJson as reactRouter_v7 } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import { satisfies } from "compare-versions";
import { installPackage } from "../lib/installPackage.js";
import type { Codemod } from "../lib/applyCodemod.js";
import { applyCodemodToAllSourceFiles } from "../lib/applyCodemod.js";

export const name = "Remove react-router-typesafe";
export const cliVersion = "3.53.0";

export async function check() {
	let pkg = await reactRouter_v7("./package.json", true);
	let packages = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let reactRouterVersion = pkg.dependencies?.["react-router"];

	return (
		reactRouterVersion &&
		(!satisfies(reactRouterVersion, ">=7.0.0") || Boolean(packages.find((p) => p === "react-router-typesafe")))
	);
}

const codemod: Codemod = (j, root) => {
	let modified = false;

	["react-router-typesafe", "react-router"].forEach((library) => {
		let importDeclaration = root.find(j.ImportDeclaration, { source: { value: library } });

		if (importDeclaration.length) {
			let deferSpecifier = importDeclaration.find(j.ImportSpecifier, { imported: { name: "defer" } });

			if (deferSpecifier.length) {
				let deferName = deferSpecifier.get().getValueProperty("local").name;
				deferSpecifier.remove();

				root.find(j.CallExpression, { callee: { name: deferName } }).replaceWith((path) => path.node.arguments);
			}

			importDeclaration
				.find(j.Literal, { value: "react-router-typesafe" })
				.replaceWith((path) => j.literal("react-router"));

			modified = true;
		}
	});

	return modified;
};

export async function execute() {
	let pkg = await reactRouter_v7("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let packagesToRemove: string[] = ["react-router-typesafe"];

	await removePackageIfExists(packagesToRemove, dependencies);

	await installPackage(["react-router", "react-router-dom"], {
		dependencies,
		updateIfExists: true,
	});

	await applyCodemodToAllSourceFiles(codemod, name);
}
