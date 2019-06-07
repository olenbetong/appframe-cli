const log = require("npmlog");
const path = require("path");
const fs = require("graceful-fs");
const appframe = require("../appframe.js");

let exitCode = 0;
let itWorked = false;

let logFileName = null;
function getLogFile() {
  if (!logFileName) {
    logFileName = path.resolve(
      appframe.config.get("cache"),
      "_logs",
      new Date().toISOString().replace(/[.:]/g, "_") + "-debug.log"
    );
  }
  return logFileName;
}

const timings = {
  version: appframe.version,
  command: process.argv.slice(2),
  logfile: null
};

process.on("timing", function(name, value) {
  if (timings[name]) {
    timings[name] += value;
  } else {
    timings[name] = value;
  }
});

process.on("exit", code => {
  process.emit("timeEnd", "appframe");
  log.disableProgress();

  if (appframe.config.loaded && appframe.config.get("timing")) {
    try {
      timings.logfile = getLogFile();
    }
  }
  if (code) {
    itWorked = false;
  }

  if (itWorked) {
  }
});

function exit(code, noLog) {}

function errorHandler(err) {
  if (!err) {
    return exit(0);
  }
}

module.exports = errorHandler;
module.exports.exit = exit;
