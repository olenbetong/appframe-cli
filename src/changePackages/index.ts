import * as packageFile from "./packageFile.js";
import * as eslint from "./eslint.js";
import * as renameTypeFiles from "./renameTypeFiles.js";
import * as obsoleteFiles from "./obsoleteFiles.js";
import * as prettier from "./prettier.js";
import * as configFiles from "./configFiles.js";

export type ChangePackage = {
	check: () => Promise<boolean>;
	execute: () => Promise<void>;
	name: string;
	description?: string;
};

export const changePackages: ChangePackage[] = [
	packageFile,
	eslint,
	renameTypeFiles,
	obsoleteFiles,
	prettier,
	configFiles,
];
