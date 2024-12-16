import chalk from "chalk";
import { changePackages } from "./changePackages/index.js";
import { execShellCommand } from "./lib/execShellCommand.js";

async function updateProjectSetup() {
	await execShellCommand("git pull");
	await execShellCommand("pnpm install");

	for (let changePackage of changePackages) {
		if (await changePackage.check()) {
			console.log(chalk.yellow(`Updating project setup: ${changePackage.name}`));
			await changePackage.execute();
		} else {
			console.log(chalk.green(`Project setup already updated: ${changePackage.name}`));
		}
	}
}

updateProjectSetup().catch((error) => {
	console.error(chalk.red(error.message));
	process.exit(1);
});
