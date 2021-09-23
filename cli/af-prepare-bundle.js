import chalk from "chalk";
import { config } from "dotenv";

import dsBundles from "../data/dsBundles.js";
import { Server } from "../lib/Server.js";
import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

config({ path: process.cwd() + "/.env" });

dsBundles.errorHandler = (error) => {
  throw Error(error);
};

try {
  let packageConfig = await importJson("./package.json", true);
  let safePackageName = packageConfig.name.replace("@", "").replace("/", "-");
  let rootOutputFolder = packageConfig.name.split("/")[0];
  let tarball = `${safePackageName}-${packageConfig.version}.tgz`;
  let zipFileName = `${safePackageName}-${packageConfig.version}.zip`;
  let hostname = "dev.obet.no";
  let server = new Server(hostname);
  await server.login();

  let bundle = await server.getBundle(packageConfig.name);
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
  await execShellCommand("npm pack");
  console.log("Making output directory...");
  await execShellCommand(`mkdir -p ${packageConfig.name}`);
  console.log(`Extracting '${tarball}'...`);
  await execShellCommand(`tar -xvzf ${tarball} -C ${packageConfig.name}`);
  console.log(`Moving from 'package' to '${packageConfig.version}'...`);
  await execShellCommand(
    `mv ${packageConfig.name}/package ${packageConfig.name}/${packageConfig.version}`
  );
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
  console.log(error.message);
  console.log(error.inner);
}
