import chalk from "chalk";
import prompts from "prompts";

import { Server } from "../lib/Server.js";

const isInteractive = process.stdout.isTTY;

try {
  let prodServer = new Server("test.obet.no");
  let result = await prodServer.login();
  if (result !== true) {
    throw Error("Login failed!");
  }
  let transactions = await prodServer.list("apply");
  if (transactions.length === 0) {
    console.error(chalk.yellow("No transactions available to apply."));
  } else {
    console.table(transactions);
    if (isInteractive) {
      let result = await prompts({
        type: "confirm",
        name: "confirmApply",
        message: "Are you sure you want to apply these transactions?",
        initial: false,
      });

      if (!result.confirmApply) {
        process.exit(0);
      }
    }

    await prodServer.apply();
    await prodServer.logServerMessage("Done.");
  }
} catch (error) {
  console.error(chalk.red(error.message));
  process.exit(1);
}
