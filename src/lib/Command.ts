import { Command as BaseCommand, Option } from "commander";

const isInteractive = process.stdout.isTTY;

export type ServerOption = {
	server: string;
};

export class Command extends BaseCommand {
	addNamespaceArgument(required = false) {
		this.argument(required && !isInteractive ? "<namespace>" : "[namespace]", "name of the namespace to use");

		if (!required) {
			this.option("-a, --all", "use to apply command to all namespaces");
		}

		return this;
	}

	addResourceArgument(required = false) {
		this.argument(required && !isInteractive ? "<resource>" : "[resource]", "name of the resource to use");

		return this;
	}

	addServerOption(isOptional = false) {
		if (isInteractive || isOptional) {
			const serverOption = new Option("-s, --server <server>", "server to connect to").choices([
				"dev.obet.no",
				"stage.obet.no",
				"test.obet.no",
			]);
			this.addOption(serverOption);
		} else {
			this.requiredOption("-s, --server <server>", "server to connect to");
		}

		return this;
	}
}
