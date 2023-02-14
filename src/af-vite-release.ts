import chalk from "chalk";
import { Command } from "./lib/Command.js";
import { importJson } from "./lib/importJson.js";
import crypto from "node:crypto";
import { unlink, writeFile, readFile } from "node:fs/promises";
import { execShellCommand, spawnShellCommand } from "./lib/execShellCommand.js";
import { Server } from "./lib/Server.js";
import semver from "semver";
import prompts from "prompts";

const cli = await importJson("../package.json");

async function createApplicationRelease(
  type: string,
  options: { preid?: string; apply: boolean }
) {
  let tempfile = crypto.randomBytes(8).readBigUInt64LE(0).toString(24) + ".tmp";

  try {
    let status = (await execShellCommand("git status --porcelain")).trim();
    if (status) {
      throw Error(
        "Working tree has uncommitted changes, please commit or remove the changes before continuing\n" +
          status
      );
    }

    let appPkg = await importJson("./package.json", true);
    let { appframe } = appPkg;
    let { hostname, id } = appframe.article;
    let server = new Server("dev.obet.no");

    let nextVersion = (
      await execShellCommand(
        `npx semver ${appPkg.version} -i ${type} ${
          options.preid ? `--preid=${options.preid}` : ""
        }`
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

    console.log("Running type checks...");
    await spawnShellCommand("npx", ["tsc"]);
    await server.login();

    let { Namespace } = await server.getArticle(hostname, id);
    let tempnotes = `## ${appPkg.name}@${nextVersion}\n\n#### 🚀 Enhancements\n- New features and improvements\n\n#### 🐛 Bugfix\n- Bug fixes\n\n#### 🏠 Internal changes\n- Changes that don't affect the user`;

    await writeFile(tempfile, tempnotes, { encoding: "utf-8" });
    await spawnShellCommand("nano", [tempfile]);

    let releaseNotes = await readFile(tempfile, { encoding: "utf-8" });

    // Give the user a chance to abort the release by
    if (releaseNotes.trim() === "" || releaseNotes === tempnotes) {
      throw Error("Release aborted. No release notes were written.");
    }

    let version = (
      await execShellCommand(
        `npm version ${type} ${options.preid ? `--preid ${options.preid}` : ""}`
      )
    ).trim();
    releaseNotes = `## ${appPkg.name}@${version.replace(
      "v",
      ""
    )}\n\n${releaseNotes}`;

    await spawnShellCommand("git", ["push", "--follow-tags"]);
    await spawnShellCommand("gh", [
      "release",
      "create",
      version.trim(),
      "-F",
      tempfile,
    ]);
    await unlink(tempfile);

    console.log("Waiting a bit to let GitHub initialize the action...");

    await execShellCommand("sleep 5");
    let githubId = await execShellCommand(
      "gh run list -L 1 --json databaseId --jq '.[].databaseId'"
    );

    await spawnShellCommand("gh", ["run", "watch", githubId.trim()]);

    let applyParameters = ["apply", "-s", "test.obet.no", Namespace];

    if (options.apply) {
      applyParameters.push("-p", `${hostname}/${id}`);
    }

    await spawnShellCommand("af", applyParameters);
  } catch (error) {
    console.error(chalk.red((error as Error).message));
    try {
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
    false
  )
  .option("--preid <preid>", "Pre-id parameter to send to npm version")
  .action(createApplicationRelease);

await program.parseAsync(process.argv);
