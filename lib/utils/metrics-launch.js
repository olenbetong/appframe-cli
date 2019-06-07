const fs = require("graceful-fs");
const child_process = require("child_process");

if (require.main === module) {
  main();
}

function launchSendMetrics() {
  const path = require("path");
  const appframe = require("../appframe.js");

  try {
    if (!appframe.config.get("send-metrics")) return;
    const cliMetrics = path.join(
      appframe.config.get("cache"),
      "anonymous-cli-metrics.json"
    );
    const targetServer = appframe.config.get("metrics-server");
    fs.statSync(cliMetrics);
    return runInBackground(__filename, [cliMetrics, targetServer]);
  } catch (ex) {
    // if the metrics file doesn't exist, don't run
  }
}

function runInBackground(js, args, opts) {
  if (!args) {
    args = [];
  }

  args.unshift(js);

  if (!opts) {
    opts = {};
  }

  opts.stdio = "ignore";
  opts.detached = true;

  const child = child_process.spawn(process.execPath, args, opts);
  child.unref();

  return child;
}

function main() {
  const sendMetrics = require("metrics.js").send;
  const metricsFile = process.argv[2];
  const metricsServer = process.argv[3];

  sendMetrics(metricsFile, metricsServer);
}

module.exports = launchSendMetrics;
