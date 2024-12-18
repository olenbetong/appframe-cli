import { importJson } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import jscodeshift from "jscodeshift";
import { readFile, writeFile } from "node:fs/promises";
import { getProjectFile } from "../lib/getProjectFile.js";
import { getFiles } from "../lib/getFiles.js";

export const name = "Remove react-helmet";
export const cliVersion = "3.53.0";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let packages = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));

	return Boolean(
		packages.find((p) => p === "react-router-typesafe" || p === "@types/react-helmet" || p === "react-helmet"),
	);
}

function shouldProcessFile(file: string) {
	let extension = file.split(".").pop();
	return ["ts", "tsx", "js", "jsx"].includes(extension ?? "") && !file.endsWith(".d.ts");
}

export async function execute() {
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let packagesToRemove: string[] = ["@types/react-helmet", "react-helmet"];

	await removePackageIfExists(packagesToRemove, dependencies);

	let sourceFolder = getProjectFile("./src/");
	let j = jscodeshift.withParser("tsx");

	for await (let file of getFiles(sourceFolder.pathname)) {
		if (shouldProcessFile(file)) {
			console.debug(`Processing file: ${file}`);

			let source = await readFile(file, "utf-8");
			let root = j(source, { parser: "tsx" });

			let reactHelmetImport = root.find(j.ImportDeclaration, { source: { value: "react-helmet" } });

			if (reactHelmetImport.length > 0) {
				// The import might be aliased, so we need to find the local name (e.g. import { Helmet as MyHelmet } from "react-helmet")
				let specifier = reactHelmetImport.find(j.ImportSpecifier, { imported: { name: "Helmet" } });
				if (specifier.length > 0) {
					let localName = specifier.get().getValueProperty("local").name;
					if (localName) {
						// Find any JSX elements that use the local name, and replace it with its children
						root
							.find(j.JSXElement, {
								openingElement: { name: { type: "JSXIdentifier", name: localName } },
							})
							.replaceWith((path) => {
								let children = path.node.children;

								if (!children?.length) {
									return j.jsxExpressionContainer(j.literal(null));
								}

								if (children.length === 1) {
									return children[0];
								}

								return j.jsxFragment(j.jsxOpeningFragment(), j.jsxClosingFragment(), children);
							});
					}
				}

				// Remove the import declaration
				reactHelmetImport.remove();
				await writeFile(file, root.toSource());
			}
		}
	}
}
