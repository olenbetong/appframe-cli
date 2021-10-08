import { spawnShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

try {
  let cliPkg = await importJson("../package.json");
  let args = ["install", "@olenbetong/appframe-cli@latest", "-g"];

  console.log("npm", args.join(" "));
  await spawnShellCommand("npm", args);

  try {
    let pkg = await importJson("./package.json", true);
    if (pkg.dependencies[cliPkg.name] || pkg.devDependencies[cliPkg.name]) {
      args.pop();
      console.log("npm", args.join(" "));
      await spawnShellCommand("npm", args);
    }
  } catch (error) {} // eslint-disable-line

  console.log("Update completed.");
} catch (error) {
  console.error("Update failed:", error.message);
}
