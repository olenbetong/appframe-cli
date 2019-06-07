const fs = require("fs");
const path = require("path");
const appframe = require("../appframe.js");
const uuid = require("uuid");

let inMetrics = false;

function startMetrics() {
  if (!inMetrics) {
    // loaded on demand to avoid any recursive deps when './metrics-launch' requires us.
    const metricsLaunch = require("./metrics-launch.js");
    appframe.metricsProcess = metricsLaunch();
  }
}

function stopMetrics() {
  if (!inMetrics && appframe.metricsProcess) {
    appframe.metricsProcess.kill("SIGKILL");
  }
}

function saveMetrics(itWorked) {
  if (!inMetrics) {
    // If the metrics reporter hasn't managed to PUT yet then kill it so that it doesn't
    // step on our updating the anonymous-cli-metrics json
    stopMetrics();
    const metricsFile = path.join(
      appframe.config.get("cache"),
      "anonymous-cli-metrics.json"
    );
    let metrics = null;

    try {
      metrics = JSON.parse(fs.readFileSync(metricsFile));
      metrics.metrics.to = new Date().toISOString();
      if (itWorked) {
        ++metrics.metrics.successfulInstalls;
      } else {
        ++metrics.metrics.failedInstalls;
      }
    } catch (ex) {
      metrics = {
        metricId: uuid.v4(),
        metrics: {
          from: new Date().toISOString(),
          to: new Date().toISOString(),
          successfulInstalls: itWorked ? 1 : 0,
          failedInstalls: itWorked ? 0 : 1
        }
      };
    }

    try {
      fs.writeFileSync(metricsFile, JSON.stringify(metrics));
    } catch (ex) {
      // we couldn't write the error metrics file, um, well, oh well.
    }
  }
}

function sendMetrics(metricsFile, metricsRegistry) {
  inMetrics = true;
  const cliMetrics = JSON.parse(fs.readFileSync(metricsFile));

  // TODO: Upload metrics file
}

exports.start = startMetrics;
exports.stop = stopMetrics;
exports.save = saveMetrics;
exports.send = sendMetrics;
