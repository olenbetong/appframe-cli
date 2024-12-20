import type { Codemod } from "../lib/applyCodemod.js";
import { applyCodemodToAllSourceFiles } from "../lib/applyCodemod.js";

export const name = "Remove unnecessary fragments";
export const cliVersion = "3.55.3";

export async function check() {
	return true;
}

const codemod: Codemod = (j, root) => {
	let fragments = root.find(j.JSXFragment).filter((path) => j.JSXElement.check(path.parent.node));

	if (fragments.length) {
		fragments.replaceWith((path) => path.node.children);
		return true;
	}

	return false;
};

export async function execute() {
	await applyCodemodToAllSourceFiles(codemod, name);
}
