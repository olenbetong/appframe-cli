import chalk from "chalk";
import { Command } from "./lib/Command.js";
import { importJson } from "./lib/importJson.js";
import crypto from "node:crypto";
import { unlink, writeFile, readFile } from "node:fs/promises";
import { execShellCommand, spawnShellCommand } from "./lib/execShellCommand.js";
import { Server } from "./lib/Server.js";

const cli = await importJson("../package.json");

async function createApplicationRelease(type: string) {
  let tempfile = crypto.randomBytes(8).readBigUInt64LE(0).toString(24) + ".tmp";

  try {
    let appPkg = await importJson("./package.json", true);
    let { appframe } = appPkg;
    let { hostname, id } = appframe.article;
    let server = new Server("dev.obet.no");
    await server.login();
    let { Namespace } = await server.getArticle(hostname, id);
    let tempnotes =
      "#### 🚀 Enhancements\n- New features and improvemens\n\n#### 🐛 Bugfix\n- Bug fixes\n\n#### 🏠 Internal changes\n- Changes that don't affect the user";
    await writeFile(tempfile, tempnotes, { encoding: "utf-8" });
    await spawnShellCommand("nano", [tempfile]);
    let version = (await execShellCommand(`npm version ${type}`)).trim();
    let releaseNotes = await readFile(tempfile, { encoding: "utf-8" });
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
    await spawnShellCommand("af", [
      "apply",
      "-s",
      "test.obet.no",
      Namespace,
      "-p",
      `${hostname}/${id}`,
    ]);
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
  .action(createApplicationRelease);

await program.parseAsync(process.argv);
