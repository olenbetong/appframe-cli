/**
 * @typedef TemplateDef
 * @type {object}
 * @property {string} title - Name of the template.
 * @property {string} source - Relative path of the source in the CLI folder.
 * @property {string} target - Relative path of the target file in the project folder
 */

/** @type {Record<string, TemplateDef>} */
export const templates = {
	"types-config": {
		title: "types.json to customize data object/procedure types",
		source: "/templates/types.json.tpl",
		target: "./types.json",
	},
	"global-types": {
		title: "Global Appframe Types",
		source: "/templates/global.d.ts.tpl",
		target: "./src/global.d.ts",
	},
	"vite-server": {
		title: "Vite - Config",
		source: "/templates/vite.config.mjs.tpl",
		target: "./vite.config.mjs",
	},
	"vite-config": {
		title: "Vite - Dev server",
		source: "/templates/server.mjs.tpl",
		target: "./server.mjs",
	},
	"workflow-build-and-deploy": {
		title: "Github Workflow - Build and deploy",
		source: "/templates/github-workflows-build-and-deploy.yaml.tpl",
		target: "./.github/workflows/build-and-deploy.yaml",
	},
	"vs-code-settings": {
		title: "VS Code workspace config",
		source: "/templates/vscode-settings.json.tpl",
		target: "./.vscode/settings.json",
	},
};
