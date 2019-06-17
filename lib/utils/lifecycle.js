exports = module.exports = runLifecycle;

const lifecycleOpts = require("../config/lifecycle");
const lifecycle = require("npm-lifecycle");

function runLifecycle(pkg, stage, wd, moreOpts) {
  const opts = lifecycleOpts(moreOpts);
  return lifecycle(pkg, stage, wd, opts);
}
