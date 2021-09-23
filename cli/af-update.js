import { execShellCommand } from "../lib/execShellCommand.js";

try {
  let cmd = "npm install -g @olenbetong/appframe-cli@latest";
  console.log(cmd);
  await execShellCommand(cmd);
  console.log("Update completed.");
} catch (error) {
  console.error("Update failed:", error.message);
}
