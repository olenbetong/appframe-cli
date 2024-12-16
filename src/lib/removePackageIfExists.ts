import { execShellCommand } from "./execShellCommand.js";

export async function removePackageIfExists(packages: string[], dependencies: string[]) {
	for (let pkg of packages) {
		if (dependencies.includes(pkg)) {
			console.log(`Removing '${pkg}'...`);
			await execShellCommand(`pnpm rm ${pkg} --force`);
		}
	}
}
