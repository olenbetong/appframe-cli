import chalk from "chalk";
import { Command } from "commander";
import { spawn } from "node:child_process";
import prompts from "prompts";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import { writeFile } from "node:fs/promises";

function getProjectFile(file) {
  return new URL(file, `file://${process.cwd()}/`);
}

function runCreateReactApp(name) {
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

async function initApp(name) {
  await runCreateReactApp(name);

  let server = new Server("dev.obet.no");
  await server.login();
  await server.dsNamespaces.refreshDataSource();

  let questions = [
    {
      type: "select",
      name: "hostname",
      message: "Which website should the app be deployed to?",
      choices: [
        { title: "SynergiWeb", value: "synergi.olenbetong.no" },
        { title: "PartnerWeb", value: "partner.olenbetong.no" },
      ],
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit(0);
          });
        }
      },
      initial: 0,
    },
    {
      type: "select",
      name: "newOrExisting",
      message: "Use an existing article, or create a new?",
      choices: [
        { value: "new", title: "Create a new article" },
        { value: "existing", title: "Use an existing article" },
      ],
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit(0);
          });
        }
      },
      initial: 0,
    },
    {
      type: (prev) => (prev === "new" ? "autocomplete" : null),
      name: "namespace",
      message: "Namespace to create article in?",
      choices: server.dsNamespaces.getData().map((r) => ({
        title: r.GroupTitle ? `${r.Name} (${r.GroupTitle})` : r.Name,
        value: r.ID,
      })),
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit(0);
          });
        }
      },
    },
    {
      type: (prev) => (prev === "existing" ? null : "text"),
      name: "articleTitle",
      message: "Enter article title",
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit(0);
          });
        }
      },
    },
    {
      type: "text",
      name: "articleId",
      message: "Enter article ID",
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit(0);
          });
        }
      },
    },
  ];

  let result = await prompts(questions);

  if (result.newOrExisting === "new") {
    await server.createArticle({
      namespaceId: result.namespace,
      hostname: result.hostname,
      id: result.articleId,
      htmlContent:
        '@Render("Template", ID: "ob.scripts.light")\n<div id="root"></div>',
      title: result.articleTitle,
      template: "ob.es.noscript",
    });

    // Add admin role to permissions
    await server.addArticlePermission({
      hostname: result.hostname,
      articleId: result.articleId,
      roleId: 1,
    });
  }

  let pkg = await importJson(`./${name}/package.json`, true);
  pkg.appframe = pkg.appframe ?? {};
  pkg.appframe.article = result.articleId;
  pkg.appframe.hostname = result.hostname;

  await writeFile(
    getProjectFile(`./${name}/package.json`),
    JSON.stringify(pkg, null, 2)
  );
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
