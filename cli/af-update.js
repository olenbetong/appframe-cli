import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

try {
  let cliPkg = await importJson("../package.json");
  let cmd = "npm install -g @olenbetong/appframe-cli@latest";

  try {
    let pkg = await importJson("./package.json", true);
    if (pkg.dependencies[cliPkg.name] || pkg.devDependencies[cliPkg.name]) {
      cmd = "npm install @olenbetong/appframe-cli@latest";
    }
  } catch (error) {} // eslint-disable-line

  console.log(cmd);
  await execShellCommand(cmd);

  console.log("Update completed.");
} catch (error) {
  console.error("Update failed:", error.message);
}
