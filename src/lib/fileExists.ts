import { access } from "node:fs/promises";

export async function fileExists(file: string, useCwd = false) {
	let completeUrl = new URL(file, useCwd ? `file://${process.cwd()}/` : import.meta.url);

	try {
		await access(completeUrl);
		return true;
	} catch (error) {
		return false;
	}
}
