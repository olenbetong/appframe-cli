import chalk from "chalk";
import dotenv from "dotenv";
import { Text, render, useApp } from "ink";
import fs from "node:fs/promises";
import { Fragment, createElement as h, useEffect, useState } from "react";

import * as af from "@olenbetong/appframe-data";
import { Client, setDefaultClient } from "@olenbetong/appframe-data";

import { importJson } from "./lib/importJson.js";

dotenv.config();

async function exists(path: string | URL) {
  try {
    await fs.stat(path);
    return true;
  } catch (error) {
    return false;
  }
}

const appPackageJson = await importJson("./package.json", true);
const { appframe } = appPackageJson;
const { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;
const client = new Client(appframe.deploy?.hostname ?? appframe.devHostname);

await client.login(username ?? "", password ?? "");
setDefaultClient(client);

const dsArticlesBlocks = af.generateApiDataObject({
  id: "dsArticlesBlocks",
  resource: "stbv_WebSiteCMS_HtmlBlocks",
  fields: ["PrimKey", "HostName", "ArticleId", "ID", "HtmlContent"],
  allowInsert: true,
  allowUpdate: true,
});

const dsArticlesScripts = af.generateApiDataObject({
  id: "dsArticlesScripts",
  resource: "stbv_WebSiteCMS_ArticlesScripts",
  fields: ["PrimKey", "Script", "Exclude", "ID", "HostName", "ArticleID"],
  allowInsert: true,
  allowUpdate: true,
});

const dsArticlesStyles = af.generateApiDataObject({
  id: "dsArticlesStyles",
  resource: "stbv_WebSiteCMS_ArticlesStyles",
  fields: ["PrimKey", "Style", "Exclude", "ID", "HostName", "ArticleID"],
  allowInsert: true,
  allowUpdate: true,
});

const procCheckoutArticle = new af.ProcedureAPI<any, any>({
  procedureId: "sstp_WebSiteCMS_CheckOutArticle",
  parameters: [{ name: "HostName" }, { name: "ArticleID" }, { name: "Forced" }],
});

const procRemovePreviousBuild = new af.ProcedureAPI<any, any>({
  procedureId: "astp_WebSiteCMS_DeleteArticleWebpackFiles",
  parameters: [{ name: "HostName" }, { name: "ArticleID" }],
});

function shouldFileBeExcluded(file: string) {
  let exclude =
    file.includes(".chunk") ||
    file.endsWith(".map") ||
    file.endsWith("LICENSE") ||
    file.endsWith("LICENSE.txt");

  let isMain = file.startsWith("main") || file.startsWith("vendors-main");

  if (isMain && !file.endsWith(".map")) {
    exclude = false;
  }

  return exclude;
}

let scriptPath: string;
let stylePath: string;
let styles: string[] = [];
let scripts: string[] = [];
let vitePath = new URL(`file://${process.cwd()}/dist/assets/`);
let isVite =
  appPackageJson.devDependencies["vite"] || appPackageJson.dependencies["vite"];

if (isVite) {
  console.log(chalk.blue("Using Vite configuration"));

  scriptPath = `file://${process.cwd()}/dist/file/article/script/${
    appframe.article?.id ?? appframe.article
  }/`;
  stylePath = vitePath.toString();

  if (await exists(vitePath)) {
    let files = await fs.readdir(vitePath);
    styles = files.filter(
      (file) => file.endsWith(".css") || file.endsWith(".css.map")
    );
  }
  scripts = await fs.readdir(new URL(scriptPath));
} else {
  console.log(chalk.blue("Using CRA configuration"));

  scriptPath = `file://${process.cwd()}/build/file/article/script/${
    appframe.article?.id ?? appframe.article
  }/`;
  stylePath = `file://${process.cwd()}/build/file/article/style/${
    appframe.article?.id ?? appframe.article
  }/`;

  // Separate try/catch blocks, since there might not be a style folder,
  // which is not a problem.
  try {
    styles = await fs.readdir(new URL(stylePath));
  } catch (error) {
    console.log(chalk.red((error as Error).message));
  }
  try {
    scripts = await fs.readdir(new URL(scriptPath));
  } catch (error) {
    console.log(chalk.red((error as Error).message));
  }
}

async function getFileContents(path: string, file: string) {
  let filePath = new URL(file, path);

  return await fs.readFile(filePath, "utf-8");
}

function Deployer() {
  let [hasCheckedOut, setHasCheckedOut] = useState(false);
  let [hasRemovedPrevious, setHasRemovedPrevious] = useState(false);
  let [styleCount, setStyleCount] = useState(0);
  let [styleDone, setStyleDone] = useState(0);
  let [scriptCount, setScriptCount] = useState(0);
  let [scriptDone, setScriptDone] = useState(0);
  let [blockDone, setBlockDone] = useState(false);
  let { exit } = useApp();

  useEffect(() => {
    async function doStuff() {
      let articleHost = appframe.article?.hostname ?? appframe.hostname;
      let articleId = appframe.article?.id ?? appframe.article;

      await procCheckoutArticle.executeAsync({
        HostName: articleHost,
        ArticleID: articleId,
        Forced: true,
      });
      setHasCheckedOut(true);
      await procRemovePreviousBuild.executeAsync({
        HostName: articleHost,
        ArticleID: articleId,
      });
      setHasRemovedPrevious(true);

      // Publish styles
      setStyleCount(styles.length);
      for (let file of styles) {
        let record = {
          ArticleID: articleId,
          HostName: articleHost,
          ID: file,
          Exclude: shouldFileBeExcluded(file),
          Style: await getFileContents(stylePath, file),
        };

        dsArticlesStyles.setParameter(
          "whereClause",
          `[HostName] = '${articleHost}' AND [ArticleID] = '${articleId}' AND [ID] = '${file}'`
        );
        await dsArticlesStyles.refreshDataSourceAsync();
        dsArticlesStyles.setCurrentIndex(
          dsArticlesStyles.getDataLength() > 0 ? 0 : -1
        );
        await dsArticlesStyles.saveAsync(record);
        setStyleDone((d) => d + 1);
      }

      // Publish scripts
      setScriptCount(scripts.length);
      for (let file of scripts) {
        let record = {
          ArticleID: articleId,
          HostName: articleHost,
          ID: file,
          Exclude: isVite ? true : shouldFileBeExcluded(file),
          Script: await getFileContents(scriptPath, file),
        };

        dsArticlesScripts.setParameter(
          "whereClause",
          `[HostName] = '${articleHost}' AND [ArticleID] = '${articleId}' AND [ID] = '${file}'`
        );
        await dsArticlesScripts.refreshDataSourceAsync();
        dsArticlesScripts.setCurrentIndex(
          dsArticlesScripts.getDataLength() > 0 ? 0 : -1
        );
        await dsArticlesScripts.saveAsync(record);
        setScriptDone((d) => d + 1);
      }

      if (isVite) {
        let blockHandler = dsArticlesBlocks.dataHandler;
        let blocks = (await blockHandler.retrieve({
          whereClause: `[HostName] = '${articleHost}' AND [ArticleID] = '${articleId}' AND [ID] = 'ViteScripts'`,
        })) as any[];
        let block;
        if (blocks.length === 0) {
          block = await blockHandler.create({
            HostName: articleHost,
            ArticleId: articleId,
            ID: "ViteScripts",
          });
        } else {
          block = blocks[0];
        }

        let manifest = await importJson(`./dist/manifest.json`, true);
        let entry = manifest["index.html"];
        let html = `<script src="${entry.file.replace(
          "file/article",
          `/file/article`
        )}" type="module"></script>`;
        if (entry.imports) {
          for (let name of entry.imports) {
            let chunk = manifest[name];
            html += `\n<link type="modulepreload" href= src="${chunk.file.replace(
              "file/article",
              `/file/article`
            )}">`;
          }
        }

        await blockHandler.update({
          PrimKey: block.PrimKey,
          HtmlContent: html,
        });

        setBlockDone(true);
      }

      exit();
    }

    doStuff();
  }, []);

  return h(
    Fragment,
    {},
    h(
      Text,
      {},
      hasCheckedOut
        ? "  ✅ Checked out article"
        : "  ⬛ Checking out article..."
    ),
    h(
      Text,
      {},
      hasCheckedOut
        ? hasRemovedPrevious
          ? "  ✅ Removed previous build"
          : "  ⬛ Removing previous build..."
        : "  ⬛ Remove previous build"
    ),
    h(
      Text,
      {},
      hasRemovedPrevious
        ? styleDone === styleCount
          ? `  ✅ Published stylesheets (${styleDone}/${styleCount})`
          : `  ⬛ Publishing stylesheets (${styleDone}/${styleCount})...`
        : "  ⬛ Publish stylesheets"
    ),
    h(
      Text,
      {},
      hasRemovedPrevious && styleDone === styleCount
        ? scriptDone === scriptCount
          ? `  ✅ Published scripts (${scriptDone}/${scriptCount})`
          : `  ⬛ Publishing scripts (${scriptDone}/${scriptCount})...`
        : "  ⬛ Publish scripts"
    ),
    isVite &&
      h(
        Text,
        {},
        hasRemovedPrevious && scriptDone === scriptCount
          ? blockDone
            ? `  ✅ Update script block`
            : `  ⬛ Updating HTLM script block...`
          : "  ⬛ Update HTML script block"
      )
  );
}

async function deploy() {
  render(h(Deployer));
}

deploy().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
