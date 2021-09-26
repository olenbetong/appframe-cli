import { Command as BaseCommand, Option } from "commander";

const isInteractive = process.stdout.isTTY;

export class Command extends BaseCommand {
  addServerOption() {
    if (isInteractive) {
      const serverOption = new Option(
        "-s, --server <server>",
        "server to connect to"
      ).choices(["dev.obet.no", "stage.obet.no", "test.obet.no"]);
      this.addOption(serverOption);
    } else {
      this.requiredOption("-s, --server <server>", "server to connect to");
    }

    return this;
  }
}
