import { importJson } from "../lib/importJson.js";
import { removePackageIfExists } from "../lib/removePackageIfExists.js";
import type { Codemod } from "../lib/applyCodemod.js";
import { applyCodemodToAllSourceFiles } from "../lib/applyCodemod.js";
import { satisfies } from "compare-versions";
import { installPackage } from "../lib/installPackage.js";

export const name = "Remove react-helmet";
export const cliVersion = "3.53.0";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let packages = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let reactVersion = pkg.dependencies?.react;

	return (
		!satisfies(reactVersion, ">=19.0.0") ||
		Boolean(packages.find((p) => p === "react-router-typesafe" || p === "@types/react-helmet" || p === "react-helmet"))
	);
}

const codemod: Codemod = (j, root) => {
	let reactHelmetImport = root.find(j.ImportDeclaration, { source: { value: "react-helmet" } });

	if (reactHelmetImport.length > 0) {
		// The import might be aliased, so we need to find the local name (e.g. import { Helmet as MyHelmet } from "react-helmet")
		let specifier = reactHelmetImport.find(j.ImportSpecifier, { imported: { name: "Helmet" } });
		if (specifier.length > 0) {
			let localName = specifier.get().getValueProperty("local").name;
			if (localName) {
				// Find any JSX elements that use the local name, and replace it with its children
				root
					.find(j.JSXElement, { openingElement: { name: { type: "JSXIdentifier", name: localName } } })
					.replaceWith((path) => {
						let children = path.node.children;

						if (!children || !children.length) {
							return j.JSXElement.check(path.parent.node) ? null : j.literal(null);
						}

						children = children.filter((child) => !j.JSXText.check(child));

						if (children.length === 1) {
							return children[0];
						}

						return j.JSXElement.check(path.parent.node)
							? children
							: j.jsxFragment(j.jsxOpeningFragment(), j.jsxClosingFragment(), children);
					});
			}
		}

		// Remove the import declaration
		reactHelmetImport.remove();

		return true;
	}

	return false;
};

export async function execute() {
	let pkg = await importJson("./package.json", true);
	let dependencies = Object.keys(pkg.devDependencies ?? {}).concat(Object.keys(pkg.dependencies ?? {}));
	let packagesToRemove: string[] = ["@types/react-helmet", "react-helmet"];

	await removePackageIfExists(packagesToRemove, dependencies);

	await installPackage(["react", "react-dom"], {
		dependencies,
		updateIfExists: true,
	});

	await installPackage(["@types/react", "@types/react-dom"], {
		dependencies,
		updateIfExists: true,
	});

	await applyCodemodToAllSourceFiles(codemod, name);
}
