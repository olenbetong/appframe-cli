import { config } from "dotenv";
import { login, setHostname } from "@olenbetong/data-object/node";
import { dsTransactions } from "../data/index.js";
import { Command, Option } from "commander";
import { importJson } from "../lib/importJson.js";

config({ path: process.cwd() + "/.env" });
let { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

const appPkg = await importJson("../package.json");

async function listTransactions(options) {
  setHostname(options.server);
  console.log(`Logging in (${options.server}, user '${username}')...`);
  await login(username, password);

  console.log("Getting transactions...");
  let filter =
    options.type === "apply"
      ? "[Status] IN (0, 2, 4) AND [IsLocal] = 0"
      : "(([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)";
  dsTransactions.setParameter("whereClause", filter);
  await dsTransactions.refreshDataSource();

  if (dsTransactions.getDataLength() > 0) {
    console.table(
      dsTransactions.map((r) => ({
        Namespace: r.Namespace,
        Name: r.Name,
        CreatedBy: r.CreatedBy,
        LocalCreatedBy: r.LocalCreatedBy,
      }))
    );
  } else {
    console.log("No transactions found.");
  }
}

let program = new Command();
program
  .version(appPkg.version)
  .option(
    "-s, --server <hostname>",
    "Hostname to list transactions from",
    "dev.obet.no"
  )
  .addOption(
    new Option("-t, --type <type>", "Type of transactions to list")
      .choices(["apply", "deploy"])
      .default("apply")
  )
  .action(listTransactions);

await program.parseAsync(process.argv);
