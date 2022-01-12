import chalk from "chalk";
import { spawnShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

try {
  let cliPkg = await importJson("../package.json");
  let args = ["install", "@olenbetong/appframe-cli@latest", "-g"];

  console.log("npm", args.join(" "));
  await spawnShellCommand("npm", args);

  try {
    let pkg = await importJson("./package.json", true);
    if (pkg.dependencies?.[cliPkg.name] || pkg.devDependencies?.[cliPkg.name]) {
      args.pop();
      console.log("npm", args.join(" "));
      await spawnShellCommand("npm", args);
    } else {
      console.log(
        chalk.blue(
          "CLI not found in local package.json. Skipping local install."
        )
      );
    }
  } catch (error) {
    console.log(
      chalk.blue("No package.json found, skipping local install"),
      error.message
    );
  }

  console.log(chalk.green("Update completed."));
} catch (error) {
  console.error(chalk.red("Update failed: " + error.message));
}
