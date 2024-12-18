import { fileExists } from "../lib/fileExists.js";
import { renameFileIfExists } from "../lib/renameFileIfExists.js";
import type { Codemod } from "../lib/applyCodemod.js";
import { applyCodemodToAllSourceFiles } from "../lib/applyCodemod.js";
import type { Collection, JSCodeshift } from "jscodeshift";

export const name = "Rename generated type files";
export const cliVersion = "3.53.0";

export async function check() {
	let hasOldDataObjectsTypes = await fileExists("./src/dataObjects.d.ts", true);
	let hasOldCustomTypes = await fileExists("./src/customTypes.d.ts", true);

	return hasOldCustomTypes || hasOldDataObjectsTypes;
}

const getCodemod = (originalImport: string, newImport: string) => (j: JSCodeshift, root: Collection<any>) => {
	let importDeclaration = root.find(j.ImportDeclaration, { source: { value: originalImport } });

	if (importDeclaration.length) {
		importDeclaration.find(j.Literal, { value: originalImport }).replaceWith((path) => j.literal(newImport));

		return true;
	}

	return false;
};

export async function execute() {
	await renameFileIfExists("./src/dataObjects.d.ts", "./src/appframe.d.ts");
	await renameFileIfExists("./src/customTypes.d.ts", "./src/custom.d.ts");

	let codemod: Codemod = getCodemod("~/dataObjects", "~/appframe");
	await applyCodemodToAllSourceFiles(codemod, "Rename 'dataObjects' imports to 'appframe'");

	codemod = getCodemod("~/customTypes", "~/custom");
	await applyCodemodToAllSourceFiles(codemod, "Rename 'customTypes' imports to 'custom'");
}
