import chalk from "chalk";
import { access, copyFile, mkdir, writeFile } from "node:fs/promises";

import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

function getProjectFile(file) {
  return new URL(file, `file://${process.cwd()}/`);
}

function getCLIFile(file) {
  return new URL(file, import.meta.url);
}

async function fileExists(file, useCwd = false) {
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

async function updateProjectSetup() {
  console.log("Configuring package.json...");

  const pkg = await importJson("./package.json", true);
  pkg.scripts.start = "af cra generate-types && react-scripts start";
  pkg.scripts.deploy = "af cra deploy";
  pkg.scripts["publish-to-prod"] = "af cra publish";
  pkg.scripts["generate-types"] = "af cra generate-types";
  pkg.browserslist = {
    production: [
      "last 6 chrome versions",
      "last 6 firefox versions",
      "safari >= 12",
    ],
    development: [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version",
    ],
  };

  pkg.appframe = pkg.appframe ?? {};
  pkg.appframe.article = pkg.appframe.article ?? pkg.name;
  pkg.appframe.devHostname = pkg.appframe.devHostname ?? "dev.obet.no";
  pkg.appframe.disableExternals = pkg.appframe.disableExternals ?? false;
  pkg.appframe.hostname = pkg.appframe.hostname ?? "synergi.olenbetong.no";
  pkg.appframe.proxyRoutes = pkg.appframe.proxyRoutes ?? [];
  pkg.appframe.usePreact = pkg.appframe.usePreact ?? false;

  await writeFile(
    getProjectFile("./package.json"),
    JSON.stringify(pkg, null, 2)
  );

  let dependencies = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];

  if (!dependencies.includes("@olenbetong/appframe-cli")) {
    console.log("Adding @olenbetong/appframe-cli...");
    await execShellCommand("npm install -D @olenbetong/appframe-cli");
  }

  console.log("Installing latest @olenbetong/data-object...");
  await execShellCommand("npm i @olenbetong/data-object@latest");

  if (!(await fileExists("./.github/workflows", true))) {
    await mkdir(getProjectFile("./.github/workflows"), { recursive: true });
  }

  if (!(await fileExists("./.github/workflows/build-and-deploy.yaml", true))) {
    console.log("Adding build and deploy action...");
    await copyFile(
      getCLIFile("../templates/github-workflows-build-and-deploy.yaml.tpl"),
      getProjectFile("./.github/workflows/build-and-deploy.yaml")
    );
  }

  if (
    !(await fileExists("./.github/workflows/publish-and-deploy.yaml", true))
  ) {
    console.log("Adding publish and deploy action...");
    await copyFile(
      getCLIFile("../templates/github-workflows-publish-and-deploy.yaml.tpl"),
      getProjectFile("./.github/workflows/publish-and-deploy.yaml")
    );
  }

  console.log("Updating VS Code workspace settings...");
  if (!(await fileExists("./.vscode", true))) {
    await mkdir(getProjectFile("./.vscode"));
  }

  await copyFile(
    getCLIFile("../templates/vscode-settings.json.tpl"),
    getProjectFile("./.vscode/settings.json")
  );
}

updateProjectSetup().catch((error) => {
  console.error(chalk.red(error.message));
  process.exit(1);
});
