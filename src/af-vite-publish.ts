import { Server } from "./lib/Server.js";
import { importJson } from "./lib/importJson.js";
import { Command } from "commander";
import chalk from "chalk";
import prompts, { PromptObject } from "prompts";
import { execShellCommand } from "./lib/execShellCommand.js";

type StageOperation = "download" | "apply" | "deploy" | "generate" | "publish";

async function runStageOperations(
	devHost: string,
	operations: StageOperation[] = ["download"],
	{ hostname, article: articleProp, version }: { hostname: string; article: string; version?: string },
	state: { article?: any } = {},
) {
	let lastSuccessfulStep = "none";
	try {
		let server = new Server(devHost);
		await server.login();
		lastSuccessfulStep = "login";

		let transactionName = `${hostname}/${articleProp}`;
		let article = state.article ?? (await server.getArticle(hostname, articleProp));
		lastSuccessfulStep = "getArticleInformation";

		state.article = article;

		if (operations.includes("publish")) {
			await server.publishArticle(hostname, articleProp, version ?? "No version description was added :(");
			lastSuccessfulStep = "publish";
		}

		if (operations.includes("download")) {
			await server.download(article.Namespace);
			lastSuccessfulStep = "download";
		}

		if (operations.includes("generate")) {
			await server.generate(article.Namespace_ID);
			lastSuccessfulStep = "generate";
		}

		if (operations.includes("apply")) {
			await server.assertOnlyOneTransaction("apply", transactionName, article.Namespace);
			await server.checkoutArticle(article.HostName, article.ArticleId);
			await server.apply(article.Namespace_ID);
			lastSuccessfulStep = "apply";
		}

		if (operations.includes("deploy")) {
			await server.assertOnlyOneTransaction("deploy", transactionName, article.Namespace);
			await server.deploy(article.Namespace_ID);
			lastSuccessfulStep = "deploy";
		}
	} catch (error: any) {
		error.lastSuccessfulStep = lastSuccessfulStep;
		throw error;
	}
}

async function publishFromDev(articleWithHost?: string, version?: string) {
	let config: { hostname: string; article: string; version?: string };
	if (articleWithHost) {
		let [hostname, article] = articleWithHost.split("/");
		config = {
			hostname,
			article,
			version,
		};

		if (!config.version) {
			let question: PromptObject<"version"> = {
				type: "text",
				name: "version",
				message: "Enter a release description",
			};

			let answer = await prompts(question);
			config.version = answer.version;
		}
	} else {
		try {
			let pkg = await importJson("./package.json", true);
			let version: string;
			try {
				version = (await execShellCommand("git describe")).trim();
			} catch (error) {
				version = pkg.version;
			}

			config = {
				article: pkg.appframe.article?.id ?? pkg.appframe.artcle,
				hostname: pkg.appframe.article?.hostname ?? pkg.appframe.hostname,
				version,
			};
		} catch (error) {
			console.log(
				chalk.red(
					"Failed to load article config. Either run the command from a folder with a SynergiWeb application with appframe config in package.json, or provide an argument with hostname and article ID.",
				),
			);
			console.log(chalk.red((error as any).message));

			process.exit(1);
		}
	}

	let crossServerState = {};

	try {
		await runStageOperations("dev.obet.no", ["publish", "generate", "deploy"], config, crossServerState);
		await runStageOperations("stage.obet.no", ["download", "apply", "deploy"], config, crossServerState);
		await runStageOperations("test.obet.no", ["download"], config, crossServerState);
	} catch (error) {
		console.log(chalk.red(`Failed to publish: ${(error as any).message}`));
		console.log(chalk.red(`Last successful step: ${(error as any).lastSuccessfulStep}`));
		process.exit(1);
	}
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.argument(
		"[article-with-hostname]",
		"Select article and hostname to publish (ex. synergi.olenbetong.no/portal). Will look for a CRA config in package.json if undefined",
	)
	.argument("[description]", "Description to set in the version notes. Only used if article-with-hostname is set")
	.action(publishFromDev);

await program.parseAsync(process.argv);
