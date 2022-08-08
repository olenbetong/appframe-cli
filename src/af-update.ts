import chalk from "chalk";
import { spawnShellCommand } from "./lib/execShellCommand.js";
import { importJson } from "./lib/importJson.js";

try {
  let cliPkg = await importJson("../package.json");
  let cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  let args = ["install", "@olenbetong/appframe-cli@latest", "-g"];

  console.log(cmd, args.join(" "));
  await spawnShellCommand(cmd, args);

  try {
    let pkg = await importJson("./package.json", true);
    if (pkg.dependencies?.[cliPkg.name] || pkg.devDependencies?.[cliPkg.name]) {
      args.pop();
      console.log(cmd, args.join(" "));
      await spawnShellCommand(cmd, args);
    } else {
      console.log(
        chalk.blue(
          "CLI not found in local package.json. Skipping local install."
        )
      );
    }
  } catch (error: any) {
    console.log(chalk.blue("No package.json found, skipping local install"));
  }

  console.log(chalk.green("Update completed."));
} catch (error: any) {
  console.error(chalk.red("Update failed: " + error.message));
}
