import chalk from "chalk";
import { Command } from "./lib/Command.js";
import { importJson } from "./lib/importJson.js";
import crypto from "node:crypto";
import { unlink, writeFile, readFile } from "node:fs/promises";
import { execShellCommand, spawnShellCommand } from "./lib/execShellCommand.js";
import { Server } from "./lib/Server.js";
import prompts from "prompts";

const cli = await importJson("../package.json");

async function createApplicationRelease(
	type: string,
	options: { preid?: string; apply: boolean; workflow: boolean },
) {
	let tempfile = crypto.randomBytes(8).readBigUInt64LE(0).toString(24) + ".tmp";

	try {
		// Check if there are uncommited changes in the git repo.
		let status = (await execShellCommand("git status --porcelain")).trim();
		if (status) {
			throw Error(
				"Working tree has uncommitted changes, please commit or remove the changes before continuing\n" +
					status,
			);
		}

		// Check if we are on the master or main branch. Only relevant if not using a GitHub
		// workflow, as the GitHub workflow automatically works against the main branch
		if (options.workflow) {
			let branch = (
				await execShellCommand("git rev-parse --abbrev-ref HEAD")
			).trim();
			if (!["master", "main"].includes(branch)) {
				throw Error(
					`Releases should only be done from the main/master branch. You are on the '${branch}' branch.`,
				);
			}
		}

		// Check if the GitHub CLI is available. Required to create releases, even if we don't
		// use the GitHub workflow to publish
		let ghCliPath = (await execShellCommand("command -v gh")).trim();
		if (!ghCliPath) {
			throw Error(
				`This command requires the GitHub CLI to be installed. Please install it before trying again.`,
			);
		}

		// Check that the user has logged in using the GitHub CLI.
		try {
			await spawnShellCommand("gh", ["auth", "status"]);
		} catch (error) {
			throw Error("Please log in to GitHub using the gh CLI (gh auth login");
		}

		// Verify that pnpm is available
		let pnpmPath = (await execShellCommand("command -v gh")).trim();
		if (!pnpmPath) {
			throw Error(
				`This command use pnpm to build the project. Please install (npm install -g pnpm && pnpm setup) before trying again.`,
			);
		}

		// Make sure we include changes done by other users on the main branch
		await spawnShellCommand("git", ["pull"]);

		let appPkg = await importJson("./package.json", true);
		let { appframe } = appPkg;
		let { hostname, id } = appframe.article;
		let server = new Server("dev.obet.no");

		// In case the user forgot to put the version type (minor, major, prerelease etc.) in the command line,
		// we ask them to confirm the new version before continuing. Doing this as early as possible, since some
		// of the following commands can take some time.
		let nextVersion = (
			await execShellCommand(
				`pnpm dlx semver ${appPkg.version} -i ${type} ${
					options.preid ? `--preid ${options.preid}` : ""
				}`,
			)
		).trim();
		let result = await prompts({
			type: "confirm",
			name: "confirmVersion",
			message: `New version number will be ${nextVersion}. Do you want to continue? (y/N)`,
			initial: false,
		});

		if (!result.confirmVersion) {
			process.exit(0);
		}

		// If Typescript validation fails, the release will stop. Doing this before the GitHub release, since
		// it would be harder to reverse changes after that. In addition it sucks to write release notes only
		// to have to re-write them because the build failed.
		console.log("Running type checks...");
		await spawnShellCommand("pnpm", ["exec", "tsc"]);
		await server.login();

		let { Namespace } = await server.getArticle(hostname, id);
		let tempnotes = `## ${appPkg.name}@${nextVersion}\n\n#### 🚀 Enhancements\n- New features and improvements\n\n#### 🐛 Bugfix\n- Bug fixes\n\n#### 🏠 Internal changes\n- Changes that don't affect the user`;

		await writeFile(tempfile, tempnotes, { encoding: "utf-8" });
		await spawnShellCommand("nano", [tempfile]);

		let releaseNotes = await readFile(tempfile, { encoding: "utf-8" });

		// Give the user a chance to abort the release by not writing any release notes, either
		// by clearing the file, or exiting without saving.
		if (releaseNotes.trim() === "" || releaseNotes === tempnotes) {
			throw Error("Release aborted. No release notes were written.");
		}

		let version = (
			await execShellCommand(
				`pnpm version ${type} ${
					options.preid ? `--preid ${options.preid}` : ""
				}`,
			)
		).trim();
		releaseNotes = `## ${appPkg.name}@${version.replace(
			"v",
			"",
		)}\n\n${releaseNotes}`;

		// Push the tag pointing to this release so we can create a release with release notes on GitHub
		await spawnShellCommand("git", ["push", "--follow-tags"]);

		await spawnShellCommand("gh", [
			"release",
			"create",
			version.trim(),
			"-F",
			tempfile,
		]);

		await unlink(tempfile);

		if (options.workflow) {
			console.log("Starting GitHub workflow...");
			await execShellCommand("gh workflow run build-and-deploy.yaml");

			// It sometimes takes a few seconds before the new workflow run is listed by the CLI
			await execShellCommand("sleep 5");

			let githubId = await execShellCommand(
				"gh run list --workflow build-and-deploy.yaml -L 1 --json databaseId --jq '.[].databaseId'",
			);

			await spawnShellCommand("gh", ["run", "watch", githubId.trim()]);
		} else {
			await spawnShellCommand("pnpm", ["run", "build"]);
			await spawnShellCommand("pnpm", ["exec", "af", "vite", "deploy"]);
			await spawnShellCommand("pnpm", ["exec", "af", "vite", "publish"]);
		}

		let applyParameters = ["apply", "-s", "test.obet.no", Namespace];

		if (options.apply) {
			// af apply will ask the user to confirm the updates before applying. But if the list of
			// updates only includes the article, we can pre-approve the updates by passing hostname/articleId
			// to the -p argument.
			applyParameters.push("-p", `${hostname}/${id}`);
		}

		await spawnShellCommand("af", applyParameters);
	} catch (error) {
		console.error(chalk.red((error as Error).message));
		try {
			// In case the git push or gh release commands fail, make sure we still delete the temporary
			// release notes file
			await unlink(tempfile);
		} catch (_) {}
		process.exit(1);
	}
}

const program = new Command();
program
	.version(cli.version)
	.argument("[type]", "version type passed to npm version", "patch")
	.option(
		"-a, --apply",
		"automatically apply the application on production if there are no other updates in the same namespace",
		false,
	)
	.option("-w, --workflow", "use the GitHub workflow to")
	.option("--preid <preid>", "Pre-id parameter to send to npm version")
	.action(createApplicationRelease);

await program.parseAsync(process.argv);
