import chalk from "chalk";
import { exec, spawn } from "node:child_process";

/**
 * Executes the command in `cmd` in the background, and returns
 * a promise that resolves with the stdout data.
 *
 * @param {string} cmd Command to execute
 * @param {boolean} pipeOutput Set to true to pipe output to stdout and stderr
 * @returns
 */
export function execShellCommand(cmd: string, pipeOutput: boolean = false): Promise<string> {
	return new Promise((resolve, reject) => {
		let childProcess = exec(cmd, (error, stdout, stderr) => {
			if (error) {
				(error as any).inner = stderr;
				reject(error);
			} else {
				resolve(stdout ? stdout : stderr);
			}
		});

		if (pipeOutput) {
			childProcess.stdout?.pipe(process.stdout);
			childProcess.stderr?.pipe(process.stderr);
		}
	});
}

/**
 * Spawns a child process with inherited stdio.
 * Use this when the command might need interaction from the user.
 *
 * @param {string} cmd Command to execute
 * @param {string[]} args Arguments to pass to the command
 * @returns Promise<any>
 */
export function spawnShellCommand(cmd: string, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		let proc = spawn(cmd, args, { stdio: "inherit", shell: true });

		proc.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject();
			}
		});

		proc.on("error", (error) => {
			console.error(chalk.red(error.message));
			reject(error);
		});
	});
}
