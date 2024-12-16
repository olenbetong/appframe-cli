import { rename } from "fs/promises";
import { fileExists } from "./fileExists.js";
import { getProjectFile } from "./getProjectFile.js";

export async function renameFileIfExists(file: string, newName: string) {
	if (await fileExists(file, true)) {
		await rename(getProjectFile(file), getProjectFile(newName));
	}
}
