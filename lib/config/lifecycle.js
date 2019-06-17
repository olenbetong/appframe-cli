const appframe = require("../appframe.js");
const log = require("npmlog");

let opts;

function lifecycleOpts(moreOpts) {
  if (!opts) {
    opts = {
      config: appframe.config.snapshot,
      dir: appframe.dir,
      failOk: false,
      force: appframe.config.get("force"),
      group: appframe.config.get("group"),
      ignorePrepublish: appframe.config.get("ignore-prepublish"),
      ignoreScripts: appframe.config.get("ignore-scripts"),
      log: log,
      nodeOptions: appframe.config.get("node-options"),
      production: appframe.config.get("production"),
      scriptShell: appframe.config.get("script-shell"),
      scriptsPrependNodePath: appframe.config.get("scripts-prepend-node-path"),
      unsafePerm: appframe.config.get("unsafe-perm"),
      user: appframe.config.get("user")
    };
  }

  return moreOpts ? Object.assign({}, opts, moreOpts) : opts;
}

module.exports = lifecycleOpts;
