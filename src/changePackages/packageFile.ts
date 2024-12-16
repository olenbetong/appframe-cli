import { writeFile } from "node:fs/promises";
import { importJson } from "../lib/importJson.js";
import { compareVersions } from "compare-versions";

const APPFRAME_PACKAGE_VERSION = "1.0.0";

function getProjectFile(file: string) {
	return new URL(file, `file://${process.cwd()}/`);
}

export const name = "Update package.json";

export async function check() {
	let pkg = await importJson("./package.json", true);
	let afPackageVersion = pkg.appframe?.packageVersion ?? "0.0.0";

	return compareVersions(APPFRAME_PACKAGE_VERSION, afPackageVersion) > 0;
}

export async function execute() {
	console.log("Configuring package.json...");

	let pkg = await importJson("./package.json", true);
	pkg.scripts.start = "af vite generate-types && vite dev";
	pkg.scripts.build = "tsc && vite build";
	pkg.scripts.deploy = "af vite deploy";
	pkg.scripts.check = "pnpm dlx npm-check-updates -i -p pnpm --pre 1 --format group";
	pkg.browserslist = {
		production: ["last 6 chrome versions", "last 6 firefox versions", "safari >= 16"],
		development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"],
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
		hostname: pkg.appframe.proxyHostname ?? pkg.appframe.deploy.hostname ?? "dev.obet.no",
		routes: pkg.appframe.proxyRoutes ?? [],
	};

	pkg.appframe.packageVersion = APPFRAME_PACKAGE_VERSION;

	delete pkg.appframe.devHostname;
	delete pkg.appframe.disableExternals;
	delete pkg.appframe.hostname;
	delete pkg.appframe.proxyHostname;
	delete pkg.appframe.proxyRoutes;
	delete pkg.appframe.usePreact;
	delete pkg.eslint;

	await writeFile(getProjectFile("./package.json"), JSON.stringify(pkg, null, 2));
}
