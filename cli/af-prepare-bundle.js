import { config } from "dotenv";
import { fileFromPath } from "formdata-node/file-from-path";

import { FileUploader, login, setHostname } from "@olenbetong/data-object/node";

import dsBundles from "../data/dsBundles.js";
import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

config({ path: process.cwd() + "/.env" });

let { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

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

  console.log("Logging in...");
  setHostname(hostname);
  await login(username, password);

  console.log("Get bundle ID...");
  dsBundles.setParameter(
    "whereClause",
    `[Name] = '${packageConfig.name}' AND [Version] = 0`
  );
  await dsBundles.refreshDataSource();

  let { ID: id, Project_ID } =
    dsBundles.getDataLength() > 0 ? dsBundles.getData(0) : {};
  if (id) {
    console.log(`Found bundle with Version/Project ID: ${id}/${Project_ID}`);
  } else {
    console.log("No bundle found...");
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
    console.log("Uploading zip...");
    let uploader = new FileUploader({
      route: `/api/bundle-push/${id}`,
      hostname,
    });
    let zipFile = await fileFromPath(
      `${safePackageName}-${packageConfig.version}.zip`
    );
    await uploader.upload(zipFile, { Project_ID });
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
