import { exec } from "node:child_process";

/**
 * Executes the command in `cmd` in the background, and returns
 * a promise that resolves with the stdout data.
 *
 * @param {string} cmd Command to execute
 * @param {boolean} pipeOutput Set to true to pipe output to stdout and stderr
 * @returns
 */
export function execShellCommand(cmd, pipeOutput = false) {
  return new Promise((resolve, reject) => {
    let childProcess = exec(cmd, (error, stdout, stderr) => {
      if (error) {
        error.inner = stderr;
        reject(error);
      } else {
        resolve(stdout ? stdout : stderr);
      }
    });

    if (pipeOutput) {
      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
    }
  });
}
