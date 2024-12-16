import { execShellCommand } from "./execShellCommand.js";
import { importJson } from "./importJson.js";

export async function installPackage(
	packages: string | string[],
	options: {
		isDev?: boolean;
		updateIfExists?: boolean;
		dependencies: string[];
	},
) {
	let pkg = await importJson("./package.json", true);
	let { isDev = false, updateIfExists = false, dependencies } = options;
	if (typeof packages === "string") {
		packages = [packages];
	}

	let toInstall = [];

	for (let pkg of packages) {
		let exists = dependencies.includes(pkg);
		if (exists && updateIfExists) {
			console.log(`Updating '${pkg}'...`);
			toInstall.push(pkg);
		} else if (!exists) {
			console.log(`Adding '${pkg}'...`);
			toInstall.push(pkg);
		}
	}

	if (toInstall.length > 0) {
		let cmd = `pnpm i ${isDev ? "-D " : ""}${toInstall.map((pkg) => `${pkg}@latest`).join(" ")} --force`;

		await execShellCommand(cmd);
	}
}
