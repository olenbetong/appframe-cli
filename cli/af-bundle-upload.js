import chalk from "chalk";
import { config } from "dotenv";

import dsBundles from "../data/dsBundles.js";
import { Server } from "../lib/Server.js";
import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";
import { Command } from "commander";

config({ path: process.cwd() + "/.env" });

dsBundles.errorHandler = (error) => {
  throw Error(error);
};

async function prepareBundle(pkgName) {
  try {
    let name;
    let version;

    if (pkgName) {
      name = pkgName;
      version = await execShellCommand(`npm view ${pkgName} version`);
      version = version.trim();
    } else {
      let packageConfig = await importJson("./package.json", true);
      name = packageConfig.name;
      version = packageConfig.version;
    }

    let safePackageName = name.replace("@", "").replace("/", "-");
    let rootOutputFolder = name.split("/")[0];
    let tarball = `${safePackageName}-${version}.tgz`;
    let zipFileName = `${safePackageName}-${version}.zip`;
    let hostname = "dev.obet.no";
    let server = new Server(hostname);
    await server.login();

    let bundle = await server.getBundle(name);
    let { ID: id, Project_ID } = bundle;
    if (id) {
      server.logServerMessage(
        `Found bundle with Version/Project ID: ${id}/${Project_ID}`
      );
    } else {
      console.log(chalk.yellow("No bundle found..."));
    }

    console.log("Removing previous...");
    await execShellCommand(`rm -rf ${rootOutputFolder}`);
    console.log("Packing...");
    await execShellCommand(pkgName ? `npm pack ${pkgName}` : "npm pack");
    console.log("Making output directory...");
    await execShellCommand(`mkdir -p ${name}`);
    console.log(`Extracting '${tarball}'...`);
    await execShellCommand(`tar -xvzf ${tarball} -C ${name}`);
    console.log(`Moving from 'package' to '${version}'...`);
    await execShellCommand(`mv ${name}/package ${name}/${version}`);
    console.log("Zipping...");
    await execShellCommand(`zip -r ${zipFileName} ./${rootOutputFolder}`);
    console.log("Cleaning...");
    await execShellCommand(`rm -rf ${rootOutputFolder}`);
    await execShellCommand(`rm ${tarball}`);

    if (id) {
      await server.uploadBundle(Project_ID, id, zipFileName);
      await execShellCommand(`rm ${zipFileName}`);
      console.log("Done!");
    } else {
      console.log("Launching explorer...");
      try {
        await execShellCommand("explorer.exe .");
      } catch (error) {} // eslint-disable-line
    }
  } catch (error) {
    console.log(chalk.red(error.message));
    console.log(error.inner);
  }
}

const cliPkg = await importJson("../package.json");
const program = new Command();
program
  .version(cliPkg.version)
  .argument(
    "[package]",
    "Optional package name. If provided packs the npm package with name [package]"
  )
  .action(prepareBundle);

await program.parseAsync();
