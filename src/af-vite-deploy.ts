import dotenv from "dotenv";
import { Text, render, useApp } from "ink";
import fs from "node:fs/promises";
import { Fragment, createElement as h, useEffect, useState } from "react";

import * as af from "@olenbetong/appframe-data";
import { Client, setDefaultClient } from "@olenbetong/appframe-data";

import { importJson } from "./lib/importJson.js";
import chalk from "chalk";

dotenv.config();

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
  procedureId: "astp_WebShared_DeleteArticleWebpackFiles",
  parameters: [{ name: "HostName" }, { name: "ArticleID" }],
});

let scriptPath: string = `file://${process.cwd()}/dist/file/article/script/${
  appframe.article?.id ?? appframe.article
}/`;
let stylePath: string = `file://${process.cwd()}/dist/file/article/style/${
  appframe.article?.id ?? appframe.article
}/`;
let styles: string[] = [];
let scripts: string[] = await fs.readdir(new URL(scriptPath));
let manifest = await importJson(`./dist/manifest.json`, true);

// Not every application generates CSS files. Can safely ignore errors
try {
  let files = await fs.readdir(new URL(stylePath));
  styles = files.filter(
    (file) => file.endsWith(".css") || file.endsWith(".css.map")
  );
} catch (error) {
  console.error(chalk.red((error as any).message));
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

      await procCheckoutArticle.execute({
        HostName: articleHost,
        ArticleID: articleId,
        Forced: true,
      });
      setHasCheckedOut(true);
      await procRemovePreviousBuild.execute({
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
          Exclude: manifest["index.html"]?.["css"]?.includes(file),
          Style: await getFileContents(stylePath, file),
        };

        dsArticlesStyles.setParameter(
          "whereClause",
          `[HostName] = '${articleHost}' AND [ArticleID] = '${articleId}' AND [ID] = '${file}'`
        );
        await dsArticlesStyles.refreshDataSource();
        dsArticlesStyles.setCurrentIndex(
          dsArticlesStyles.getDataLength() > 0 ? 0 : -1
        );
        await dsArticlesStyles.save(record);
        setStyleDone((d) => d + 1);
      }

      // Publish scripts
      setScriptCount(scripts.length);
      for (let file of scripts) {
        let record = {
          ArticleID: articleId,
          HostName: articleHost,
          ID: file,
          Exclude: true,
          Script: await getFileContents(scriptPath, file),
        };

        dsArticlesScripts.setParameter(
          "whereClause",
          `[HostName] = '${articleHost}' AND [ArticleID] = '${articleId}' AND [ID] = '${file}'`
        );
        await dsArticlesScripts.refreshDataSource();
        dsArticlesScripts.setCurrentIndex(
          dsArticlesScripts.getDataLength() > 0 ? 0 : -1
        );
        await dsArticlesScripts.save(record);
        setScriptDone((d) => d + 1);
      }

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

      let entry = manifest["index.html"];
      let prefetchSet = new Set<string>();

      for (let { file } of Object.values<any>(manifest)) {
        if (file && file !== entry.file && file.endsWith(".min.js")) {
          prefetchSet.add(file);
        } else if (file?.endsWith(".css") && !entry?.css?.includes(file)) {
          prefetchSet.add(file);
        }
      }

      let html = `<script src="${entry.file.replace(
        "file/article",
        `/file/article`
      )}" type="module"></script>`;

      if (entry.imports) {
        for (let name of entry.imports) {
          let chunk = manifest[name];
          html += `\n<link rel="modulepreload" href="${chunk.file.replace(
            "file/article",
            `/file/article`
          )}">`;

          if (prefetchSet.has(chunk.file)) {
            prefetchSet.delete(chunk.file);
          }
        }
      }

      for (let file of prefetchSet.values()) {
        html += `\n<link rel="prefetch" href="${file.replace(
          "file/article",
          "/file/article"
        )}" as="${file.endsWith("css") ? "style" : "script"}">`;
      }

      await blockHandler.update({
        PrimKey: block.PrimKey,
        HtmlContent: html,
      });

      setBlockDone(true);

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
