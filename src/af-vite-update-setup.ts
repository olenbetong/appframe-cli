import chalk from "chalk";
import {
	access,
	copyFile,
	mkdir,
	readdir,
	writeFile,
	unlink,
	rename,
} from "node:fs/promises";
import { resolve } from "node:path";
import { execShellCommand } from "./lib/execShellCommand.js";
import { importJson } from "./lib/importJson.js";

function getProjectFile(file: string) {
	return new URL(file, `file://${process.cwd()}/`);
}

function getCLIFile(file: string) {
	return new URL(file, import.meta.url);
}

async function fileExists(file: string, useCwd = false) {
	let completeUrl = new URL(
		file,
		useCwd ? `file://${process.cwd()}/` : import.meta.url,
	);

	try {
		await access(completeUrl);
		return true;
	} catch (error) {
		return false;
	}
}

async function removePackageIfExists(
	packages: string[],
	dependencies: string[],
) {
	for (let pkg of packages) {
		if (dependencies.includes(pkg)) {
			console.log(`Removing '${pkg}'...`);
			await execShellCommand(`pnpm rm ${pkg} --force`);
		}
	}
}

async function installPackage(
	packages: string | string[],
	options: {
		isDev?: boolean;
		updateIfExists?: boolean;
		dependencies: string[];
	},
) {
	let { isDev = false, updateIfExists = false, dependencies } = options;
	if (typeof packages === "string") {
		packages = [packages];
	}

	let toInstall = [];

	for (let pkg of packages) {
		let exists = dependencies.includes(pkg);
		if (exists && updateIfExists) {
			console.log(`Updating '${pkg}'...`);
			toInstall.push(pkg);
		} else if (!exists) {
			console.log(`Adding '${pkg}'...`);
			toInstall.push(pkg);
		}
	}

	if (toInstall.length > 0) {
		let cmd = `pnpm i ${isDev ? "-D " : ""}${toInstall
			.map((pkg) => `${pkg}@latest`)
			.join(" ")} --force`;

		await execShellCommand(cmd);
	}
}

type TemplateDef = {
	title: string;
	source: string;
	target: string;
};

async function updateTemplateFile(template: TemplateDef) {
	console.log(`Updating file from template: '${template.title}'...`);
	await copyFile(getCLIFile(template.source), getProjectFile(template.target));
}

async function removeFileIfExists(file: string) {
	if (await fileExists(file, true)) {
		await unlink(getProjectFile(file));
	}
}

async function renameFileIfExists(file: string, newName: string) {
	if (await fileExists(file, true)) {
		await rename(getProjectFile(file), getProjectFile(newName));
	}
}

async function* getFiles(dir: string): AsyncGenerator<string> {
	const dirents = await readdir(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = resolve(dir, dirent.name);

		if (dirent.isDirectory()) {
			yield* getFiles(res);
		} else {
			yield res;
		}
	}
}

async function upgradePackageConfig(pkg: any) {
	console.log("Configuring package.json...");

	let isVite = await fileExists("./vite.config.mjs", true);

	pkg.scripts.start = isVite
		? "af vite generate-types && vite dev"
		: "af vite generate-types && react-scripts start";
	pkg.scripts.build = isVite ? "tsc && vite build" : "react-scripts build";
	pkg.scripts.deploy = "af vite deploy";
	pkg.scripts.check = "NPM_CHECK_INSTALLER=pnpm pnpm dlx npm-check -u";
	pkg.browserslist = {
		production: [
			"last 6 chrome versions",
			"last 6 firefox versions",
			"safari >= 12",
		],
		development: [
			"last 1 chrome version",
			"last 1 firefox version",
			"last 1 safari version",
		],
	};

	pkg.appframe = pkg.appframe ?? {};

	if (typeof pkg.appframe.article === "string") {
		pkg.appframe.article = {
			id: pkg.appframe.article ?? pkg.name,
			hostname: pkg.appframe.hostname ?? "synergi.olenbetong.no",
		};
	} else if (!pkg.appframe.article) {
		pkg.appframe.article = {
			id: pkg.name,
			hostname: pkg.appframe.hostname ?? "synergi.olenbetong.no",
		};
	}

	pkg.appframe.deploy = pkg.appframe.deploy ?? {
		hostname: pkg.appframe.devHostname ?? "dev.obet.no",
	};

	pkg.appframe.build = pkg.appframe.build ?? {
		externals: pkg.appframe.disableExternals ? false : true,
	};

	pkg.appframe.proxy = pkg.appframe.proxy ?? {
		hostname:
			pkg.appframe.proxyHostname ??
			pkg.appframe.deploy.hostname ??
			"dev.obet.no",
		routes: pkg.appframe.proxyRoutes ?? [],
	};

	delete pkg.appframe.devHostname;
	delete pkg.appframe.disableExternals;
	delete pkg.appframe.hostname;
	delete pkg.appframe.proxyHostname;
	delete pkg.appframe.proxyRoutes;
	delete pkg.appframe.usePreact;

	await writeFile(
		getProjectFile("./package.json"),
		JSON.stringify(pkg, null, 2),
	);
}

async function ensureProjectFolderExists(folderName: string) {
	if (!(await fileExists(folderName, true))) {
		await mkdir(getProjectFile(folderName), { recursive: true });
	}
}

async function updateProjectSetup() {
	const pkg = await importJson("./package.json", true);

	await upgradePackageConfig(pkg);

	let dependencies = [
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.devDependencies ?? {}),
	];

	let packagesToRemove: string[] = [
		"@typescript-eslint/eslint-plugin",
		"@typescript-eslint/parser",
		"eslint-config-prettier",
		"eslint-plugin-react",
	];

	let packagesToInstallOrUpdate: string[] = [
		"@olenbetong/appframe-data",
		"@olenbetong/appframe-core",
		"@olenbetong/appframe-react",
	];

	let devPackagesToInstallOrUpdate: string[] = [
		"eslint",
		"prettier",
		"@trivago/prettier-plugin-sort-imports",
		"@olenbetong/eslint-config",
	];

	await removePackageIfExists(packagesToRemove, dependencies);
	await installPackage(packagesToInstallOrUpdate, {
		dependencies,
		updateIfExists: false,
	});
	await installPackage(devPackagesToInstallOrUpdate, {
		isDev: true,
		updateIfExists: false,
		dependencies,
	});

	const { templates } = await import("../templates/templates.js");

	await ensureProjectFolderExists("./.github/workflows");
	await ensureProjectFolderExists("./.vscode");

	await updateTemplateFile(templates["workflow-build-and-deploy"]);
	await updateTemplateFile(templates["vs-code-settings"]);
	await updateTemplateFile(templates["eslint-config"]);
	await updateTemplateFile(templates["prettier-config"]);

	await removeFileIfExists("./server.mjs");
	await removeFileIfExists("./index.html");
	await removeFileIfExists("./.github/workflows/publish-and-deploy.yaml");

	await renameFileIfExists("./src/dataObjects.d.ts", "./src/appframe.d.ts");
	await renameFileIfExists("./src/customTypes.d.ts", "./src/custom.d.ts");
}

updateProjectSetup().catch((error) => {
	console.error(chalk.red(error.message));
	process.exit(1);
});
