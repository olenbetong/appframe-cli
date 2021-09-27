import { spawnShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

try {
  let cliPkg = await importJson("../package.json");
  let args = ["install", "@olenbetong/appframe-cli@latest"];

  try {
    let pkg = await importJson("./package.json", true);
    if (pkg.dependencies[cliPkg.name] || pkg.devDependencies[cliPkg.name]) {
      args.push("-g");
    }
  } catch (error) {} // eslint-disable-line

  console.log("npm", args.join(" "));
  await spawnShellCommand("npm", args);

  console.log("Update completed.");
} catch (error) {
  console.error("Update failed:", error.message);
}
