import { Server } from "../lib/Server.js";
import chalk from "chalk";

async function generateAll() {
  let server = new Server("dev.obet.no");
  await server.login();
  await server.generate();
  let transactions = await server.list();
  if (transactions.length > 0) {
    console.table(transactions);
  } else {
    console.log(chalk.yellow("No transactions found"));
  }
}

generateAll().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
