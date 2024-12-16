import { mkdir } from "fs/promises";
import { fileExists } from "./fileExists.js";
import { getProjectFile } from "./getProjectFile.js";

export async function ensureProjectFolderExists(folderName: string) {
	if (!(await fileExists(folderName, true))) {
		await mkdir(getProjectFile(folderName), { recursive: true });
	}
}
