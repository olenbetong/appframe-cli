import { Option } from "commander";
import prompts from "prompts";

export function getServerOption(defaultHost) {
  const isInteractive = process.stdout.isTTY;
  const serverOption = new Option(
    "-s, --server <server>",
    "server to connect to"
  ).choices(["dev.obet.no", "stage.obet.no", "test.obet.no"]);

  if (!isInteractive) {
    serverOption.default(defaultHost);
  }

  return serverOption;
}

export async function getServerFromOptions(options) {
  if (options.server) return options.server;

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

  return response.server;
}
