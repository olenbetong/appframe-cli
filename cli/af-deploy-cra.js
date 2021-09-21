import dotenv from "dotenv";
import { Text, render, useApp } from "ink";
import fs from "node:fs/promises";
import { Fragment, createElement as h, useEffect, useState } from "react";

import * as af from "@olenbetong/data-object/node";

import { importJson } from "../lib/importJson.js";

dotenv.config();

const appPackageJson = await importJson("./package.json", true);

const { appframe } = appPackageJson;
const { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

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

const procCheckoutArticle = new af.ProcedureAPI({
  procedureId: "sstp_WebSiteCMS_CheckOutArticle",
  fields: [{ name: "HostName" }, { name: "ArticleID" }, { name: "Forced" }],
});

const procRemovePreviousBuild = new af.ProcedureAPI({
  procedureId: "astp_WebSiteCMS_DeleteArticleWebpackFiles",
  fields: [{ name: "HostName" }, { name: "ArticleID" }],
});

function shouldFileBeExcluded(file) {
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

const scriptPath = `file://${process.cwd()}/build/file/article/script/${
  appframe.article
}/`;
const stylePath = `file://${process.cwd()}/build/file/article/style/${
  appframe.article
}/`;

async function getFileContents(path, file) {
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
  let { exit } = useApp();

  useEffect(() => {
    async function doStuff() {
      await procCheckoutArticle.executeAsync({
        HostName: appframe.hostname,
        ArticleID: appframe.article,
        Forced: true,
      });
      setHasCheckedOut(true);
      await procRemovePreviousBuild.executeAsync({
        HostName: appframe.hostname,
        ArticleID: appframe.article,
      });
      setHasRemovedPrevious(true);

      let styles = await fs.readdir(new URL(stylePath));
      setStyleCount(styles.length);
      for (let file of styles) {
        let record = {
          ArticleID: appframe.article,
          HostName: appframe.hostname,
          ID: file,
          Exclude: shouldFileBeExcluded(file),
          Style: await getFileContents(stylePath, file),
        };

        dsArticlesStyles.setParameter(
          "whereClause",
          `[HostName] = '${appframe.hostname}' AND [ArticleID] = '${appframe.article}' AND [ID] = '${file}'`
        );
        await dsArticlesStyles.refreshDataSourceAsync();
        dsArticlesStyles.setCurrentIndex(
          dsArticlesStyles.getDataLength() > 0 ? 0 : -1
        );
        await dsArticlesStyles.saveAsync(record);
        setStyleDone((d) => d + 1);
      }

      let scripts = await fs.readdir(new URL(scriptPath));
      setScriptCount(scripts.length);
      for (let file of scripts) {
        let record = {
          ArticleID: appframe.article,
          HostName: appframe.hostname,
          ID: file,
          Exclude: shouldFileBeExcluded(file),
          Script: await getFileContents(scriptPath, file),
        };

        dsArticlesScripts.setParameter(
          "whereClause",
          `[HostName] = '${appframe.hostname}' AND [ArticleID] = '${appframe.article}' AND [ID] = '${file}'`
        );
        await dsArticlesScripts.refreshDataSourceAsync();
        dsArticlesScripts.setCurrentIndex(
          dsArticlesScripts.getDataLength() > 0 ? 0 : -1
        );
        await dsArticlesScripts.saveAsync(record);
        setScriptDone((d) => d + 1);
      }

      exit(0);
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
    )
  );
}

async function deploy() {
  af.setHostname(appframe.devHostname);
  await af.login(username, password);

  render(h(Deployer));
}

deploy().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
