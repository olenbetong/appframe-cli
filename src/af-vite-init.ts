import chalk from "chalk";
import { Command } from "commander";
import prompts, { type PromptObject } from "prompts";

import { Server } from "./lib/Server.js";
import { importJson } from "./lib/importJson.js";
import { rmdir, writeFile } from "node:fs/promises";
import degit from "degit";
import { execShellCommand } from "./lib/execShellCommand.js";
import { SortOrder } from "@olenbetong/appframe-data";

function getProjectFile(file: string) {
	return new URL(file, `file://${process.cwd()}/`);
}

async function tryGitCommit(name: string) {
	try {
		await execShellCommand("git add -A");
		await execShellCommand(`git commit -m "Initialize new application '${name}' using @olenbetong/appframe-cli"`);
		return true;
	} catch (e) {
		return false;
	}
}

async function installDependencies() {
	await execShellCommand(`pnpm install`);
}

async function copyTemplateRepo(name: string) {
	console.log(`Copying template repo (olenbetong/vite-template-appframe) into ./${name}...`);
	const emitter = degit("olenbetong/vite-template-appframe", {
		cache: false,
		verbose: false,
		force: true,
	});

	emitter.on("warn", (warning) => {
		console.log(chalk.yellow(warning.message));
	});

	await emitter.clone(`./${name}`);
}

async function initApp(name: string) {
	await copyTemplateRepo(name);
	process.chdir(`./${name}`);

	let initializedGit = false;

	await installDependencies();

	// Create git commit if git repo was initialized
	if (initializedGit && (await tryGitCommit(name))) {
		console.log("Created git commit.");
	}

	let server = new Server("dev.obet.no");
	await server.login();
	let namespaces = await server.dsNamespaces.retrieve({
		maxRecords: -1,
		sortOrder: [{ GroupName: SortOrder.Asc }, { Name: SortOrder.Asc }],
	});

	let questions: PromptObject<"hostname" | "newOrExisting" | "namespace" | "articleTitle" | "articleId">[] = [
		{
			type: "select",
			name: "hostname",
			message: "Which website should the app be deployed to?",
			choices: [
				{ title: "SynergiWeb", value: "synergi.olenbetong.no" },
				{ title: "PartnerWeb", value: "partner.olenbetong.no" },
			],
			onState: (state) => {
				if (state.aborted) {
					process.nextTick(() => {
						process.exit(0);
					});
				}
			},
			initial: 0,
		},
		{
			type: "select",
			name: "newOrExisting",
			message: "Use an existing article, or create a new?",
			choices: [
				{ value: "new", title: "Create a new article" },
				{ value: "existing", title: "Use an existing article" },
			],
			onState: (state) => {
				if (state.aborted) {
					process.nextTick(() => {
						process.exit(0);
					});
				}
			},
			initial: 0,
		},
		{
			type: (prev) => (prev === "new" ? "autocomplete" : null),
			name: "namespace",
			message: "Namespace to create article in?",
			choices: namespaces.map((r) => ({
				title: r.GroupName ? `${r.Name} (${r.GroupName})` : r.Name,
				value: r.ID,
			})),
			onState: (state) => {
				if (state.aborted) {
					process.nextTick(() => {
						process.exit(0);
					});
				}
			},
		},
		{
			type: "text",
			name: "articleId",
			message: "Enter article ID",
			onState: (state) => {
				if (state.aborted) {
					process.nextTick(() => {
						process.exit(0);
					});
				}
			},
		},
		{
			type: (prev) => (prev === "existing" ? null : "text"),
			name: "articleTitle",
			message: "Enter article title",
			onState: (state) => {
				if (state.aborted) {
					process.nextTick(() => {
						process.exit(0);
					});
				}
			},
		},
	];

	let result = await prompts(questions);

	if (result.newOrExisting === "new") {
		await server.createArticle({
			namespaceId: result.namespace,
			hostname: result.hostname,
			id: result.articleId,
			htmlContent:
				'@Render("Template", ID: "ob.scripts.light")\n@Render("Block", ID: "ViteScripts")\n<div id="root"></div>',
			title: result.articleTitle,
			template: "ob.es.noscript",
		});

		// Add admin role to permissions
		await server.addArticlePermission({
			hostname: result.hostname,
			articleId: result.articleId,
			roleId: 1,
		});
	}

	let blocks = await server.getArticleBlocks(result.hostname, result.articleId);
	let hasViteScripts = blocks.some((b) => b.ID === "ViteScripts");
	let hasViteHead = blocks.some((b) => b.ID === "ViteHead");

	if (!hasViteScripts) {
		await server.createArticleBlock(result.hostname, result.articleId, "ViteScripts", "");
	}

	if (!hasViteHead) {
		await server.createArticleBlock(
			result.hostname,
			result.articleId,
			"ViteHead",
			`@{
	// If the article needs to put something in the head tag of the template, add it here. Otherwise, the block is safe to delete
}`,
		);
	}

	let pkg = await importJson(`./package.json`, true);
	pkg.name = result.articleId ?? "new-application";
	pkg.version = "0.0.1";
	pkg.appframe = pkg.appframe ?? {};
	pkg.appframe.article = {
		id: result.articleId,
		hostname: result.hostname,
	};

	let stageServer = result.newOrExisting === "new" ? "dev" : "stage";
	let isPartner = result.hostname.startsWith("partner");

	pkg.appframe.proxy = {
		...pkg.appframe.proxy,
		hostname: isPartner ? `${stageServer}.partner.obet.no` : `${stageServer}.obet.no`,
	};

	await writeFile(getProjectFile(`./package.json`), JSON.stringify(pkg, null, 2));

	try {
		await writeFile(
			getProjectFile(`./src/config.ts`),
			`export const ARTICLE_ID = "${result.articleId}";
export const ARTICLE_TITLE = "${result.articleTitle}";`,
		);
	} catch (error) {
		// well that sucks
	}

	console.log();
	console.log(`Success! Created ${name} at ./${name}`);
	console.log("Inside that directory, you can run several commands:");
	console.log();
	console.log(chalk.cyan(`  pnpm start`));
	console.log("    Starts the development server.");
	console.log();
	console.log(chalk.cyan(`  pnpm run build`));
	console.log("    Bundles the app into static files for production.");
	console.log();
	console.log("We suggest that you begin by typing:");
	console.log();
	console.log(chalk.cyan("  cd"), name);
	console.log(`  ${chalk.cyan(`pnpm start`)}`);
	console.log();
	console.log("Happy hacking!");
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
	.version(appPkg.version)
	.argument("<name>", "Name of the new application. Will also be the folder name)")
	.action(initApp);

await program.parseAsync(process.argv);
