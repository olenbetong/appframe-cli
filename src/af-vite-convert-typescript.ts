import chalk from "chalk";
import { access, copyFile, rm } from "node:fs/promises";

import { execShellCommand } from "./lib/execShellCommand.js";

function getProjectFile(file: string) {
  return new URL(file, `file://${process.cwd()}/`);
}

function getCLIFile(file: string) {
  return new URL(file, import.meta.url);
}

async function fileExists(file: string, useCwd = false) {
  let completeUrl = new URL(
    file,
    useCwd ? `file://${process.cwd()}/` : import.meta.url
  );

  try {
    await access(completeUrl);
    return true;
  } catch (error) {
    return false;
  }
}

async function convertToTypescript() {
  console.log("Installing Typescript and types...");

  await execShellCommand(
    "npm i -D typescript @types/node @types/react @types/react-dom"
  );

  console.log("Replacing jsconfig with tsconfig...");
  if (await fileExists("./jsconfig.json", true)) {
    await rm(getProjectFile("./jsconfig.json"));
  }
  await copyFile(
    getCLIFile("../templates/tsconfig.json.tpl"),
    getProjectFile("./tsconfig.json")
  );
  await copyFile(
    getCLIFile("../templates/types.json.tpl"),
    getProjectFile("./types.json")
  );

  console.log("Adding global definition files...");
  await copyFile(
    getCLIFile("../templates/global.d.ts.tpl"),
    getProjectFile("./src/global.d.ts")
  );

  await copyFile(
    getCLIFile("../templates/customTypes.d.ts.tpl"),
    getProjectFile("./src/customTypes.d.ts")
  );

  if (await fileExists("./src/theme.js", true)) {
    await rm(getProjectFile("./src/theme.js"));
  }

  await copyFile(
    getCLIFile("../templates/theme.ts.tpl"),
    getProjectFile("./src/theme.ts")
  );

  console.log("Renaming files...");
  await execShellCommand(
    "find ./src -name \"*.js\" -exec rename 's/.js$/.tsx/' '{}' +"
  );
}

convertToTypescript().catch((error) => {
  console.error(chalk.red(error.message));
  process.exit(1);
});
