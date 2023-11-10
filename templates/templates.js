/**
 * @typedef TemplateDef
 * @type {object}
 * @property {string} title - Name of the template.
 * @property {string} source - Relative path of the source in the CLI folder.
 * @property {string} target - Relative path of the target file in the project folder
 */

/** @type {Record<string, TemplateDef>} */
export const templates = {
	"theme-mui-5": {
		title: "Theme for MUI 5",
		source: "../templates/theme.ts.tpl",
		target: "./src/theme.ts",
	},
	"html-synergi": {
		title: "index.html for SynergiWeb applications",
		source: "../templates/synergiweb.html.tpl",
		target: "./index.html",
	},
	"html-partner": {
		title: "index.html for Partner applications",
		source: "../templates/partnerweb.html.tpl",
		target: "./index.html",
	},
	"types-config": {
		title: "types.json to customize data object/procedure types",
		source: "../templates/types.json.tpl",
		target: "./types.json",
	},
	"global-types": {
		title: "Global Appframe Types",
		source: "../templates/global.d.ts.tpl",
		target: "./src/global.d.ts",
	},
	"eslint-config": {
		title: "eslint - Config",
		source: "../templates/eslintrc.js.tpl",
		target: "./.eslintrc.js",
	},
	"vite-server": {
		title: "Vite - Config",
		source: "../templates/vite.config.mjs.tpl",
		target: "./vite.config.mjs",
	},
	"vite-config": {
		title: "Vite - Dev server",
		source: "../templates/server.mjs.tpl",
		target: "./server.mjs",
	},
	"prettier-config": {
		title: "Prettier Config",
		source: "../templates/prettierrc.tpl",
		target: "./.prettierrc",
	},
	"workflow-build-and-deploy": {
		title: "Github Workflow - Build and deploy",
		source: "../templates/github-workflows-build-and-deploy.yaml.tpl",
		target: "./.github/workflows/build-and-deploy.yaml",
	},
	"vs-code-settings": {
		title: "VS Code workspace config",
		source: "../templates/vscode-settings.json.tpl",
		target: "./.vscode/settings.json",
	},
};
