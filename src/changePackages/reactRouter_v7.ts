import { importJson as reactRouter_v7 } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import jscodeshift from "jscodeshift";
import { readFile, writeFile } from "node:fs/promises";
import { getProjectFile } from "../lib/getProjectFile.js";
import { getFiles } from "../lib/getFiles.js";
import { satisfies } from "compare-versions";
import { installPackage } from "../lib/installPackage.js";

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

function shouldProcessFile(file: string) {
	let extension = file.split(".").pop();
	return ["ts", "tsx", "js", "jsx"].includes(extension ?? "") && !file.endsWith(".d.ts");
}

export async function execute() {
	let pkg = await reactRouter_v7("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let packagesToRemove: string[] = ["react-router-typesafe"];

	await removePackageIfExists(packagesToRemove, dependencies);

	await installPackage(["react-router", "react-router-dom"], {
		dependencies,
		updateIfExists: true,
	});

	let sourceFolder = getProjectFile("./src/");
	let j = jscodeshift.withParser("tsx");

	for await (let file of getFiles(sourceFolder.pathname)) {
		if (shouldProcessFile(file)) {
			console.debug(`Processing file: ${file}`);
			let source = await readFile(file, "utf-8");
			let root = j(source);

			let importDeclaration = root.find(j.ImportDeclaration, { source: { value: "react-router-typesafe" } });

			if (importDeclaration.length) {
				let deferSpecifier = importDeclaration.find(j.ImportSpecifier, { imported: { name: "defer" } });

				if (deferSpecifier.length) {
					let deferName = deferSpecifier.get().getValueProperty("local").name;
					deferSpecifier.remove();

					root.find(j.CallExpression, { callee: { name: "defer" } }).replaceWith((path) => path.node.arguments);
				}

				importDeclaration
					.find(j.Literal, { value: "react-router-typesafe" })
					.replaceWith((path) => j.literal("react-router"));

				await writeFile(file, root.toSource());
			}
		}
	}
}
