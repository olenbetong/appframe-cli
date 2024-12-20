import { getProjectFile } from "./getProjectFile.js";
import { getFiles } from "./getFiles.js";
import jscodeshift from "jscodeshift";
import chalk from "chalk";
import { readFile, writeFile } from "node:fs/promises";

function shouldProcessFile(file: string) {
	let extension = file.split(".").pop();
	return ["ts", "tsx", "js", "jsx"].includes(extension ?? "") && !file.endsWith(".d.ts");
}

export type Codemod = (j: jscodeshift.JSCodeshift, root: jscodeshift.Collection<any>) => boolean;

export async function applyCodemodToAllSourceFiles(codemod: Codemod, name: string) {
	let sourceFolder = getProjectFile("./src/");
	let j = jscodeshift.withParser("tsx");

	for await (let file of getFiles(sourceFolder.pathname)) {
		if (shouldProcessFile(file)) {
			let relativeFile = file.replace(sourceFolder.pathname, "");

			let source = await readFile(file, "utf-8");
			let root = j(source);
			if (codemod(j, root)) {
				await writeFile(file, root.toSource());
				console.debug(chalk.dim(`Codemod '${name}' applied to '${relativeFile}'`));
			}
		}
	}
}
