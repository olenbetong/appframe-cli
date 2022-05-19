import {
  access,
  copyFile,
  readFile,
  readdir,
  rename,
  writeFile,
  rm,
} from "node:fs/promises";
import { resolve } from "node:path";

import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";

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

function getProjectFile(file) {
  return new URL(file, `file://${process.cwd()}/`);
}

function getCLIFile(file) {
  return new URL(file, import.meta.url);
}

async function getRootFilesAndDirectories(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const rootFiles = [];

  for (const dirent of dirents) {
    rootFiles.push(dirent.name.replace(/(\.d)?\.(j|t)sx?$/, ""));
  }

  return rootFiles;
}

async function* getFiles(dir) {
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

async function removeReactScripts() {
  console.log("Removing @olenbetong/react-scripts...");
  await execShellCommand("npm uninstall @olenbetong/react-scripts");
}

async function updatePackageJson() {
  console.log("Updating package.json...");

  const appPkg = await importJson("./package.json", true);
  appPkg.scripts["start"] = "af cra generate-types && node ./server.mjs";
  appPkg.scripts["build"] = "tsc && vite build";
  delete appPkg.scripts["eject"];
  delete appPkg.scripts["test"];

  await writeFile(
    getProjectFile("./package.json"),
    JSON.stringify(appPkg, null, 2)
  );
}

async function updateTypescriptConfig() {
  console.log("Updating tsconfig.json...");
  try {
    const tsconfig = await importJson("./tsconfig.json", true);

    tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths ?? {};
    tsconfig.compilerOptions.paths["@/*"] = ["./src/*"];
    delete tsconfig.compilerOptions.baseUrl;

    await writeFile(
      getProjectFile("./tsconfig.json"),
      JSON.stringify(tsconfig, null, 2)
    );
  } catch (error) {
    await writeFile(
      getProjectFile("./tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "es2019",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: false,
            noImplicitAny: false,
            skipLibCheck: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: false,
            forceConsistentCasingInFileNames: true,
            noFallthroughCasesInSwitch: true,
            module: "esnext",
            moduleResolution: "node",
            resolveJsonModule: true,
            isolatedModules: true,
            strictNullChecks: true,
            noEmit: true,
            jsx: "react-jsx",
            paths: {
              "@/*": ["./src/*"],
            },
          },
          include: ["src"],
        },
        null,
        2
      )
    );
  }
}

async function installDependencies() {
  console.log("Installing dependencies...");
  await execShellCommand("npm install --save-optional express");
  await execShellCommand(
    "npm install -D @olenbetong/appframe-cli@latest @olenbetong/appframe-vite@latest vite @vitejs/plugin-react"
  );
}

async function updateImports() {
  console.log("Updating imports...");
  let srcDir = getProjectFile("./src/");
  let rootNames = await getRootFilesAndDirectories(srcDir.pathname);

  for await (let file of getFiles(srcDir.pathname)) {
    let fileContent = await readFile(file, "utf-8");
    for (let rootName of rootNames) {
      let re = new RegExp(
        `(import\\(?)(\\s*\\/\\*\\s*webpackChunkName:\\s+[\\w\\-]+\\s*\\*\\/)?(\\s*)"${rootName}`,
        "g"
      );
      fileContent = fileContent
        .replaceAll(`from "${rootName}`, `from "@/${rootName}`)
        .replace(re, `$1$2$3"@/${rootName}`);
    }

    await writeFile(file, fileContent);
  }
}

async function addViteScripts() {
  await copyFile(
    getCLIFile("../templates/vite.config.mjs.tpl"),
    getProjectFile("./vite.config.mjs")
  );
  await copyFile(
    getCLIFile("../templates/server.mjs.tpl"),
    getProjectFile("./server.mjs")
  );

  let appPkg = await importJson("./package.json", true);
  let hostname =
    appPkg.appframe?.hostname ??
    appPkg.appframe?.article?.hostname ??
    "synergi.olenbetong.no";
  let template =
    hostname === "partner.olenbetong.no"
      ? "partnerweb.html.tpl"
      : "synergiweb.html.tpl";

  await copyFile(
    getCLIFile(`../templates/${template}`),
    getProjectFile("./index.html")
  );

  if (await fileExists(getProjectFile("./public/favicon.ico"))) {
    await rename(
      getProjectFile("./public/favicon.ico"),
      getProjectFile("./src/favicon.ico")
    );
  }

  await rm(getProjectFile("./public"), { recursive: true, force: true });
  await rm(getProjectFile("./src/react-app-env.d.ts"), { force: true });
}

async function updateProjectSetup() {
  console.log("Updating project setup...");
  await execShellCommand("npx af vite update-setup");
}

async function migrateFromCraToVite() {
  await updatePackageJson();
  await updateTypescriptConfig();
  await updateImports();
  await addViteScripts();
  await removeReactScripts();
  await installDependencies();
  await updateProjectSetup();
}

migrateFromCraToVite().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
