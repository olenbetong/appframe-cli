import { Command } from "commander";
import { importJson } from "../lib/importJson.js";
import { spawn } from "node:child_process";
import chalk from "chalk";

function initApp(name) {
  return new Promise((resolve, reject) => {
    let cra = spawn(
      "npx",
      [
        "create-react-app",
        "--scripts-version",
        "@olenbetong/react-scripts",
        "--template",
        "@olenbetong/appframe",
        name,
      ],
      { stdio: "inherit" }
    );

    cra.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });

    cra.on("error", (error) => {
      console.error(chalk.red(error.message));
      reject(error);
    });
  });
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .argument(
    "<name>",
    "Name passed to create-react-app (will also be the folder name)"
  )
  .action(initApp);

await program.parseAsync(process.argv);
