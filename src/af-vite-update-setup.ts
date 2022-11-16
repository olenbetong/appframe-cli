import chalk from "chalk";
import { access, copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import prettier from "prettier";

import babel, { Visitor } from "@babel/core";

import { BabelTransformImportPlugin } from "./lib/BabelTransformImportPlugin.js";
import { execShellCommand } from "./lib/execShellCommand.js";
import { importJson } from "./lib/importJson.js";

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

async function removePackageIfExists(
  packages: string[],
  dependencies: string[]
) {
  for (let pkg of packages) {
    if (dependencies.includes(pkg)) {
      console.log(`Removing '${pkg}'...`);
      await execShellCommand(`npm rm ${pkg} --force`);
    } else {
      console.log(pkg, "not found");
    }
  }
}

async function installPackage(
  packages: string | string[],
  {
    isDev = false,
    updateIfExists = false,
    dependencies,
  }: { isDev?: boolean; updateIfExists?: boolean; dependencies: string[] }
) {
  if (typeof packages === "string") {
    packages = [packages];
  }

  for (let pkg of packages) {
    if (dependencies.includes(pkg)) {
      if (!updateIfExists) continue;

      console.log(`Updating '${pkg}'...`);
    } else {
      console.log(`Adding '${pkg}'...`);
    }
  }

  await execShellCommand(
    `npm i ${isDev ? "-D " : ""}${packages
      .map((pkg) => `${pkg}@latest`)
      .join(" ")} --force`
  );
}

type TemplateDef = {
  title: string;
  source: string;
  target: string;
};

async function updateTemplateFile(template: TemplateDef) {
  console.log(`Updating file from template: '${template.title}'...`);
  await copyFile(getCLIFile(template.source), getProjectFile(template.target));
}

async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

async function transformLegacyImports() {
  let srcDir = getProjectFile("./src/");
  console.log("Transforming import declarations...");

  for await (let file of getFiles(srcDir.pathname)) {
    let extension = file.substring(file.lastIndexOf("."));

    if ([".tsx", ".ts", ".jsx", ".js"].includes(extension)) {
      let isModified = false;
      let result = await babel.transformFileAsync(file, {
        retainLines: true,
        configFile: false,
        babelrc: false,
        plugins: [
          ["@babel/syntax-typescript", { isTSX: true }],
          BabelTransformImportPlugin({
            onChange() {
              isModified = true;
            },
          }),
        ],
      });

      if (isModified && result?.code) {
        let code = prettier.format(result.code, { parser: "typescript" });
        await writeFile(file, code);
      }
    }
  }
}

async function upgradePackageConfig(pkg: any) {
  console.log("Configuring package.json...");

  let isVite = await fileExists("./vite.config.mjs", true);

  pkg.scripts.start = isVite
    ? "af vite generate-types && node ./server.mjs"
    : "af vite generate-types && react-scripts start";
  pkg.scripts.build = isVite ? "tsc && vite build" : "react-scripts build";
  pkg.scripts.deploy = "af vite deploy";
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

  pkg.appframe.build = pkg.appframe.build ?? {
    externals: pkg.appframe.disableExternals ? false : true,
  };

  pkg.appframe.proxy = pkg.appframe.proxy ?? {
    hostname:
      pkg.appframe.proxyHostname ??
      pkg.appframe.deploy.hostname ??
      "dev.obet.no",
    routes: pkg.appframe.proxyRoutes ?? [],
  };

  delete pkg.appframe.devHostname;
  delete pkg.appframe.disableExternals;
  delete pkg.appframe.hostname;
  delete pkg.appframe.proxyHostname;
  delete pkg.appframe.proxyRoutes;
  delete pkg.appframe.usePreact;

  await writeFile(
    getProjectFile("./package.json"),
    JSON.stringify(pkg, null, 2)
  );
}

async function ensureProjectFolderExists(folderName: string) {
  if (!(await fileExists(folderName, true))) {
    await mkdir(getProjectFile(folderName), { recursive: true });
  }
}

async function updateProjectSetup() {
  const pkg = await importJson("./package.json", true);

  await upgradePackageConfig(pkg);

  let dependencies = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];

  let packagesToRemove: string[] = [
    "@olenbetong/data-object",
    "@olenbetong/react-data-object-connect",
    "@olenbetong/utils",
    "@olenbetong/common",
    "@olenbetong/value-toggle",
    "@olenbetong/date-navigator",
    "@olenbetong/color-card",
    "@olenbetong/ob-react",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint-config-prettier",
    "eslint-plugin-react",
  ];

  let packagesToInstallOrUpdate: string[] = [
    "@olenbetong/appframe-data",
    "@olenbetong/appframe-core",
    "@olenbetong/appframe-react",
  ];

  let devPackagesToInstallOrUpdate: string[] = [
    "eslint",
    "@olenbetong/eslint-config",
  ];

  if (
    dependencies.includes("@olenbetong/value-toggle") ||
    dependencies.includes("@olenbetong/date-navigator") ||
    dependencies.includes("@olenbetong/color-card") ||
    dependencies.includes("@olenbetong/ob-react")
  ) {
    packagesToInstallOrUpdate.push("@olenbetong/synergi-react");
  }

  await removePackageIfExists(packagesToRemove, dependencies);
  await installPackage(packagesToInstallOrUpdate, {
    dependencies,
    updateIfExists: true,
  });
  await installPackage(devPackagesToInstallOrUpdate, {
    isDev: true,
    updateIfExists: true,
    dependencies,
  });

  await transformLegacyImports();

  const { templates } = await import("../templates/templates.js");

  await ensureProjectFolderExists("./.github/workflows");
  await ensureProjectFolderExists("./.vscode");

  await updateTemplateFile(templates["workflow-build-and-deploy"]);
  await updateTemplateFile(templates["workflow-publish-and-deploy"]);
  await updateTemplateFile(templates["vs-code-settings"]);
  await updateTemplateFile(templates["eslint-config"]);
}

updateProjectSetup().catch((error) => {
  console.error(chalk.red(error.message));
  process.exit(1);
});
