import * as packageFile from "./packageFile.js";
import * as eslint from "./eslint.js";
import * as renameTypeFiles from "./renameTypeFiles.js";
import * as obsoleteFiles from "./obsoleteFiles.js";
import * as reactRouter_v7 from "./reactRouter_v7.js";
import * as prettier from "./prettier.js";
import * as configFiles from "./configFiles.js";
import * as reactHelmet from "./reactHelmet.js";

export type ChangePackage = {
	/**
	 * When change packages have been applied successfully, the current CLI version will
	 * be set in the package.json appframe configuration. The next time the update-setup
	 * command is run, change packages will only be executed if their cliVersion is higher
	 * than the version in the package.json file.
	 *
	 * If the change package does not have a cliVersion, it will always be executed if the
	 * check function returns true.
	 *
	 * This is done so that the user can make changes to files modified by the change package,
	 * and not have them overwritten by the change package on subsequent runs.
	 */
	cliVersion?: string;
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
	reactHelmet,
	reactRouter_v7,
	prettier,
	configFiles,
];
