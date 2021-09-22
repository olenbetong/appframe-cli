import { config } from "dotenv";
import { login, setHostname } from "@olenbetong/data-object/node";
import { dsTransactions, procGenerate } from "../data/index.js";

config({ path: process.cwd() + "/.env" });
let { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;

async function generateAll() {
  setHostname("dev.obet.no");
  console.log(`Logging in ('dev.obet.no', user '${username}')...`);
  await login(username, password);
  console.log("Generating transactions...");
  await procGenerate.execute();
  console.log("Getting transactions...");
  dsTransactions.setParameter(
    "whereClause",
    `(([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)`
  );
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
    console.log("No transactions found");
  }
}

generateAll().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
