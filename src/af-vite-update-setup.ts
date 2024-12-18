import chalk from "chalk";
import { changePackages } from "./changePackages/index.js";
import { execShellCommand } from "./lib/execShellCommand.js";
import { importJson } from "./lib/importJson.js";
import { compare } from "compare-versions";
import { writeFile } from "node:fs/promises";
import { getProjectFile } from "./lib/getProjectFile.js";

async function updateProjectSetup() {
	console.log("Make sure project is up to date (git pull)...");
	await execShellCommand("git pull");
	console.log("Install project dependencies (pnpm install)...");
	await execShellCommand("pnpm install");

	let pkg = await importJson("./package.json", true);
	let { version } = await importJson("../package.json");
	let appliedChangePackageVersion = pkg.appframe?.appliedChangePackageVersion ?? "0.0.0";

	for (let changePackage of changePackages) {
		if (!changePackage.cliVersion || compare(changePackage.cliVersion, appliedChangePackageVersion, ">")) {
			if (await changePackage.check()) {
				console.log(chalk.yellow(`Updating project setup: ${changePackage.name}`));
				await changePackage.execute();
			} else {
				console.log(chalk.green(`Project setup already updated: ${changePackage.name}`));
			}
		} else {
			console.log(chalk.gray(`Skip change package: ${changePackage.name} (Already applied)`));
		}
	}

	// Have to re-import the package.json in case on of the change packages modified it
	pkg = await importJson("./package.json", true);
	pkg.appframe = pkg.appframe ?? {};
	pkg.appframe.appliedChangePackageVersion = version;

	await writeFile(getProjectFile("./package.json"), JSON.stringify(pkg, null, 2));
}

updateProjectSetup().catch((error) => {
	console.error(chalk.red(error.message));
	process.exit(1);
});
