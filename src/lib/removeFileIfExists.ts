import { fileExists } from "./fileExists.js";
import { getProjectFile } from "./getProjectFile.js";
import { unlink } from "node:fs/promises";

export async function removeFileIfExists(file: string) {
	if (await fileExists(file, true)) {
		await unlink(getProjectFile(file));
	}
}
