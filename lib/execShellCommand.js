import { exec } from "node:child_process";

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
