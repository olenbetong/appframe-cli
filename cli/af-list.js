import { Command } from "../lib/Command.js";

import chalk from "chalk";
import { Option } from "commander";

import { Server } from "../lib/Server.js";
import { importJson } from "../lib/importJson.js";
import {
  getNamespaceArgument,
  getServerFromOptions,
} from "../lib/serverSelection.js";
import prompts from "prompts";

const appPkg = await importJson("../package.json");
const isInteractive = process.stdin.isTTY;

async function getType(options) {
  if (options.type) return options.type;

  if (isInteractive) {
    let question = {
      type: "select",
      name: "type",
      message: "Which type of transactions do you want to list?",
      choices: [
        { title: "Transactions that will be applied", value: "apply" },
        { title: "Transactions that will be deployed", value: "deploy" },
      ],
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit();
          });
        }
      },
    };

    let result = await prompts(question);

    return result.type;
  }
}

async function listTransactions(namespaceArg, options) {
  let hostname = await getServerFromOptions(options);
  let type = await getType(options);
  let server = new Server(hostname);

  await server.login();

  let namespace = await getNamespaceArgument(namespaceArg, options);
  let transactions = await server.getTransactions(type, namespace);

  if (transactions.length > 0) {
    console.table(transactions);
  } else {
    console.log(chalk.yellow("No transactions found."));
  }
}

let typeOption = new Option(
  "-t, --type <type>",
  "Type of transactions to list"
);

if (!isInteractive) {
  typeOption.default("apply");
}

let program = new Command();
program
  .version(appPkg.version)
  .addNamespaceArgument()
  .addServerOption()
  .addOption(typeOption)
  .action(listTransactions);

await program.parseAsync(process.argv);
