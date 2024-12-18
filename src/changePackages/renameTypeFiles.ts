import { fileExists } from "../lib/fileExists.js";
import { renameFileIfExists } from "../lib/renameFileIfExists.js";

export const name = "Rename generated type files";
export const cliVersion = "3.53.0";

export async function check() {
	let hasOldDataObjectsTypes = await fileExists("./src/dataObjects.d.ts", true);
	let hasOldCustomTypes = await fileExists("./src/customTypes.d.ts", true);

	return hasOldCustomTypes || hasOldDataObjectsTypes;
}

export async function execute() {
	await renameFileIfExists("./src/dataObjects.d.ts", "./src/appframe.d.ts");
	await renameFileIfExists("./src/customTypes.d.ts", "./src/custom.d.ts");
}
