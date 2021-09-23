import { exec } from "node:child_process";

/**
 * Executes the command in `cmd` in the background, and returns
 * a promise that resolves with the stdout data.
 *
 * @param {string} cmd Command to execute
 * @returns
 */
export function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        error.inner = stderr;
        reject(error);
      } else {
        resolve(stdout ? stdout : stderr);
      }
    });
  });
}
