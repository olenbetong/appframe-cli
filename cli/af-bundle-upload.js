import chalk from "chalk";
import { Command } from "commander";
import { config } from "dotenv";

import { Server } from "../lib/Server.js";
import { execShellCommand } from "../lib/execShellCommand.js";
import { importJson } from "../lib/importJson.js";
import prompts from "prompts";

config({ path: process.cwd() + "/.env" });

async function prepareBundle(pkgName) {
  try {
    let name;
    let version;

    if (pkgName) {
      name = pkgName;
      version = await execShellCommand(`npm view ${pkgName} version`);
      version = version.trim();
    } else {
      let packageConfig = await importJson("./package.json", true);
      name = packageConfig.name;
      version = packageConfig.version;
    }

    let safePackageName = name.replace("@", "").replace("/", "-");
    let rootOutputFolder = name.split("/")[0];
    let tarball = `${safePackageName}-${version}.tgz`;
    let zipFileName = `${safePackageName}-${version}.zip`;
    let hostname = "dev.obet.no";
    let server = new Server(hostname);
    await server.login();

    let bundle = await server.getBundle(name);

    if (!bundle) {
      server.dsNamespaces.setParameter("maxRecords", -1);
      server.dsNamespaces.setParameter("sortOrder", [
        { GroupTitle: "Asc" },
        { Name: "Asc" },
      ]);

      console.log("Bundle not found. Select a name to create it.");

      await server.dsNamespaces.refreshDataSource();

      let question = [
        {
          type: "text",
          name: "bundleName",
          message: "What is the name of the bundle?",
          initial: name,
          onState: (state) => {
            if (state.aborted) {
              process.nextTick(() => {
                process.exit(0);
              });
            }
          },
        },
        {
          type: "autocomplete",
          name: "namespace",
          message: "Select namespace",
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
      ];

      let result = await prompts(question);
      if (result.bundleName) {
        await server.createBundle(result.bundleName, result.namespace);
        bundle = await server.getBundle(name);
        console.log(bundle);
      } else {
        process.exit(0);
      }
    }

    let { ID: id, Project_ID } = bundle;
    if (id) {
      server.logServerMessage(
        `Found bundle with Version/Project ID: ${id}/${Project_ID}`
      );
    } else {
      console.log(chalk.yellow("No bundle found..."));
    }

    console.log("Removing previous...");
    await execShellCommand(`rm -rf ${rootOutputFolder}`);
    console.log("Packing...");
    await execShellCommand(pkgName ? `npm pack ${pkgName}` : "npm pack");
    console.log("Making output directory...");
    await execShellCommand(`mkdir -p ${name}`);
    console.log(`Extracting '${tarball}'...`);
    await execShellCommand(`tar -xvzf ${tarball} -C ${name}`);
    console.log(`Moving from 'package' to '${version}'...`);
    await execShellCommand(`mv ${name}/package ${name}/${version}`);
    console.log("Zipping...");
    await execShellCommand(`zip -r ${zipFileName} ./${rootOutputFolder}`);
    console.log("Cleaning...");
    await execShellCommand(`rm -rf ${rootOutputFolder}`);
    await execShellCommand(`rm ${tarball}`);

    if (id) {
      await server.uploadBundle(Project_ID, id, zipFileName);
      await execShellCommand(`rm ${zipFileName}`);
      console.log("Done!");
    } else {
      console.log("Launching explorer...");
      try {
        await execShellCommand("explorer.exe .");
      } catch (error) {} // eslint-disable-line
    }
  } catch (error) {
    console.log(chalk.red(error.message));
    console.log(error.inner);
  }
}

const cliPkg = await importJson("../package.json");
const program = new Command();
program
  .version(cliPkg.version)
  .argument(
    "[package]",
    "Optional package name. If provided packs the npm package with name [package]"
  )
  .action(prepareBundle);

await program.parseAsync();
