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

  let isVite = await fileExists("./vite.config.mjs", true);

  const pkg = await importJson("./package.json", true);
  pkg.scripts.start = isVite
    ? "af cra generate-types && node ./server.mjs"
    : "af cra generate-types && react-scripts start";
  pkg.scripts.build = isVite ? "tsc && vite build" : "react-scripts build";
  pkg.scripts.deploy = "af cra deploy";
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

  if (typeof pkg.appframe.article === "string") {
    pkg.appframe.article = {
      id: pkg.appframe.article ?? pkg.name,
      hostname: pkg.appframe.hostname ?? "synergi.olenbetong.no",
    };
  } else if (!pkg.appframe.article) {
    pkg.appframe.article = {
      id: pkg.name,
      hostname: pkg.appframe.hostname ?? "synergi.olenbetong.no",
    };
  }

  pkg.appframe.deploy = pkg.appframe.deploy ?? {
    hostname: pkg.appframe.devHostname ?? "dev.obet.no",
  };
  delete pkg.appframe.devHostname;
  pkg.appframe.build = pkg.appframe.build ?? {
    externals: pkg.appframe.disableExternals ? false : true,
  };
  delete pkg.appframe.disableExternals;
  delete pkg.appframe.hostname;
  pkg.appframe.proxy = pkg.appframe.proxy ?? {
    hostname:
      pkg.appframe.proxyHostname ??
      pkg.appframe.deploy.hostname ??
      "dev.obet.no",
    routes: pkg.appframe.proxyRoutes ?? [],
  };
  delete pkg.appframe.proxyHostname;
  delete pkg.appframe.proxyRoutes;
  delete pkg.appframe.usePreact;

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

  console.log("Updating build and deploy action...");
  await copyFile(
    getCLIFile("../templates/github-workflows-build-and-deploy.yaml.tpl"),
    getProjectFile("./.github/workflows/build-and-deploy.yaml")
  );

  console.log("Updating publish and deploy action...");
  await copyFile(
    getCLIFile("../templates/github-workflows-publish-and-deploy.yaml.tpl"),
    getProjectFile("./.github/workflows/publish-and-deploy.yaml")
  );

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
