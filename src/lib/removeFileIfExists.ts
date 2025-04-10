import { fileExists } from "./fileExists.js";
import { getProjectFile } from "./getProjectFile.js";
import { unlink } from "node:fs/promises";

export async function removeFileIfExists(file: string | string[]) {
	if (Array.isArray(file)) {
		for (const f of file) {
			await removeFileIfExists(f);
		}
	} else if (await fileExists(file, true)) {
		await unlink(getProjectFile(file));
	}
}
