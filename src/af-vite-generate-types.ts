/* global globalThis */
import chalk from "chalk";
import vm from "node:vm";
import fs from "node:fs/promises";

import {
	DataObject,
	Procedure,
	Client,
	setDefaultClient,
} from "@olenbetong/appframe-data";

import { Command } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { generateTypes } from "./lib/generateTypes.js";
import { importJson } from "./lib/importJson.js";

const appPkg = await importJson("./package.json", true);
const cliPkg = await importJson("../package.json");

setDefaultClient(new Client("dev.obet.no"));

declare global {
	var af: any;
}

globalThis.af = {
	controls: {},
	common: {
		expose,
		localStorage: {
			get(value: string, fallback: any) {
				return fallback;
			},
		},
	},
	DataObject,
	Procedure,
};

globalThis.af.controls = new Proxy(globalThis.af.controls, {
	get: () => class {},
});

function expose(path: string, value: any) {
	let properties = path.split(".");
	let final: any = properties.pop();
	let current: any = globalThis;
	for (let property of properties) {
		if (!current[property]) {
			current[property] = {};
		}
		current = current[property];
	}

	current[final] = value;
}

async function projectFileExists(file: string) {
	try {
		let url = new URL(file, `file://${process.cwd()}/`);

		await fs.access(url);
		return true;
	} catch (error) {
		return false;
	}
}

async function generateTypescriptTypes(options: { server: string }) {
	let articleHost =
		appPkg.appframe.article?.hostname ?? appPkg.appframe.hostname;
	let articleId = appPkg.appframe.article?.id ?? appPkg.appframe.article;
	let articleUrl = `${articleHost}/${articleId}`;

	let server = new Server(
		options.server ??
			appPkg.appframe.proxy?.hostname ??
			appPkg.appframe.deploy?.hostname ??
			appPkg.appframe.devHostname ??
			"dev.obet.no",
	);
	await server.login();
	server.logServerMessage(
		chalk.blueBright(`Generating data object types for '${articleUrl}'...`),
	);

	let result = await server.fetch(
		`/file/article/static-script/${articleId}.js`,
	);
	let scriptText = await result.text();

	let context = vm.createContext(globalThis);
	let script = new vm.Script(scriptText);
	try {
		script.runInContext(context);

		let customTypesPath = "./src/custom.d.ts";
		let hasCustomTypesFile = await projectFileExists(customTypesPath);
		if (!hasCustomTypesFile) {
			customTypesPath = "./src/custom.ts";
			hasCustomTypesFile = await projectFileExists(customTypesPath);
		}

		let typeOverrides = {};
		try {
			let appOverrides = await importJson("./types.json", true);
			typeOverrides = appOverrides;
		} catch (error) {
			console.log("No 'types.json' file was found with type overrides.");
		}

		let types = generateTypes(hasCustomTypesFile, typeOverrides);

		let features = await server.getArticleFeatures(articleHost, articleId);
		if (features.length) {
			types += `
			
declare module "@olenbetong/appframe-core" {
	interface AfArticle {
		features: {
			${features
				.map(
					(feature) => `/**
 			 * ${feature.Name}: ${feature.Description}
			 */
			${feature.Key}: boolean;`,
				)
				.join("\n 			")}
		};
	}
}`;
		}

		let data = new Uint8Array(Buffer.from(types));

		server.logServerMessage(
			`Writing generated types to './src/appframe.d.ts'...`,
		);

		await fs.writeFile(
			new URL("./src/appframe.d.ts", `file://${process.cwd()}/`),
			data,
		);

		server.logServerMessage("Done.");
	} catch (error) {
		console.log(chalk.red((error as Error).message));
	}
}

const program = new Command();
program
	.version(cliPkg.version)
	.addServerOption(true)
	.action(generateTypescriptTypes);

await program.parseAsync(process.argv);
