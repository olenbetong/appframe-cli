import chalk from "chalk";
import prompts from "prompts";
import { dsNamespaces } from "../data/index.js";

export async function getServerFromOptions(options) {
  if (options.server) return;

  let question = {
    type: "select",
    name: "server",
    message: "Select server to connect to",
    choices: [
      { title: "dev.obet.no", value: "dev.obet.no" },
      { title: "stage.obet.no", value: "stage.obet.no" },
      { title: "test.obet.no", value: "test.obet.no" },
    ],
  };

  let response = await prompts(question);

  options.server = response.server;
}

export async function getNamespaceArgument(namespace, options) {
  if (!namespace && !options.all) {
    if (process.stdout.isTTY) {
      dsNamespaces.setParameter("maxRecords", -1);
      await dsNamespaces.refreshDataSource();

      let question = {
        type: "autocomplete",
        name: "namespace",
        message: "Select namespace",
        choices: dsNamespaces.getData().map((r) => ({ title: r.Name })),
      };

      let result = await prompts(question);
      return result.namespace;
    } else {
      console.log(
        chalk.red(
          "Namespace must be provided if --all is not set in a non-interactive environment"
        )
      );
      process.exit(0);
    }
  }

  return namespace;
}
