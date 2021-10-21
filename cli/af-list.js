import chalk from "chalk";
import { Option } from "commander";
import prompts from "prompts";

import { Command } from "../lib/Command.js";
import { Server } from "../lib/Server.js";
import { getServerFromOptions } from "../lib/getServerFromOptions.js";
import { importJson } from "../lib/importJson.js";
import { rollups } from "d3";

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

    options.type = result.type;
  }
}

async function listTransactions(namespaceArg, options) {
  await getServerFromOptions(options);
  await getType(options);
  let server = new Server(options.server);

  await server.login();

  let namespace = await server.getNamespaceArgument(namespaceArg, options);
  let transactions = await server.getTransactions(options.type, namespace);

  if (transactions.length === 0) {
    console.log(chalk.yellow("No transactions found."));
  } else if (options.group) {
    let byNamespace = rollups(
      transactions,
      (t) => t.length,
      (t) => t.Namespace
    )
      .map((t) => ({ Namespace: t[0], "Transaction count": t[1] }))
      .sort((a, z) => z["Transaction count"] - a["Transaction count"]);

    console.table(byNamespace);
  } else {
    console.table(transactions);
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
  .option("-g, --group", "List only number of transactions per namespace")
  .action(listTransactions);

await program.parseAsync(process.argv);
