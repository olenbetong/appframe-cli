import chalk from "chalk";
import { ChangePackage, changePackages } from "./changePackages/index.js";
import { execShellCommand } from "./lib/execShellCommand.js";
import { importJson } from "./lib/importJson.js";
import { compare } from "compare-versions";
import { writeFile } from "node:fs/promises";
import { getProjectFile } from "./lib/getProjectFile.js";
import prompts from "prompts";

async function checkIfUncommittedChangesExist() {
	// Check if there are uncommited changes in the git repo.
	return await execShellCommand("git status --porcelain");
}

async function updateProjectSetup() {
	let unstagedChanges = await checkIfUncommittedChangesExist();
	if (unstagedChanges) {
		throw Error(
			"Working tree has uncommitted changes, please commit or remove the changes before continuing\n" + unstagedChanges,
		);
	}

	let { version } = await importJson("../package.json");
	let latest = (await execShellCommand("pnpm view @olenbetong/appframe-cli version")).trim();

	if (compare(version, latest, "<")) {
		console.log(
			chalk.yellow(
				`\nYou are running \`@olenbetong/appframe-cli\` v${version}, which is behind the latest release (${latest}).\n`,
			),
		);

		let result = await prompts({
			type: "confirm",
			name: "confirmContinue",
			message: "Would you like to apply the updates anyway? (y/N)",
			initial: false,
		});

		if (!result.confirmContinue) {
			return;
		}
	}

	console.log("Make sure project is up to date (git pull)...");
	await execShellCommand("git pull", true);
	console.log("Install project dependencies (pnpm install)...");
	await execShellCommand("pnpm install", true);

	let pkg = await importJson("./package.json", true);
	let appliedChangePackageVersion = pkg.appframe?.appliedChangePackageVersion ?? "0.0.0";
	let appliedChangePackages: ChangePackage[] = [];

	for (let changePackage of changePackages) {
		if (!changePackage.cliVersion || compare(changePackage.cliVersion, appliedChangePackageVersion, ">")) {
			if (await changePackage.check()) {
				console.log(chalk.yellow(`Updating project setup: ${changePackage.name}`));
				await changePackage.execute();
				appliedChangePackages.push(changePackage);
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
	await execShellCommand("pnpm exec prettier ./package.json --write", true);

	if (await checkIfUncommittedChangesExist()) {
		console.log(chalk.gray("Formatting source files with prettier..."));
		await execShellCommand("pnpm exec prettier ./src --write", true);

		console.log(chalk.gray("Creating a commit for the updated project setup..."));
		await execShellCommand("git add -A", true);

		console.log(chalk.green(`Project setup updated. The following change packages were applied:`));
		for (let changePackage of appliedChangePackages) {
			console.log(chalk.green(`  * ${changePackage.name}`));
		}

		let result = await prompts({
			type: "confirm",
			name: "confirmApply",
			message: "Changes have been staged. Would you like to run git commit now? (y/N)",
			initial: false,
		});

		if (result.confirmApply) {
			let commitMessage = `Automated project setup update (${version})`;
			commitMessage += "\n\nApplied change packages:";

			for (let changePackage of appliedChangePackages) {
				commitMessage += `\n  * ${changePackage.name.replace("'", "\\'")}`;
				if (changePackage.cliVersion) {
					commitMessage += ` (v${changePackage.cliVersion})`;
				}
			}

			await execShellCommand(`git commit -m '${commitMessage}\n'`, true);
		}
	}
}

updateProjectSetup().catch((error) => {
	console.error(chalk.red(error.message));
	process.exit(1);
});
