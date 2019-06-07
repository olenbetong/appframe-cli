const log = require("npmlog");
const path = require("path");
const fs = require("graceful-fs");
const mkdirp = require("mkdirp");
const writeFileAtomic = require("write-file-atomic");
const errorMessage = require("./error-message.js");
const stopMetrics = require("./metrics.js").stop;
const appframe = require("../appframe.js");
const rollbacks = appframe.rollbacks;

let cbCalled = false;
let exitCode = 0;
let itWorked = false;
let wroteLogFile = false;

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
      fs.appendFileSync(
        path.join(appframe.config.get("cache"), "_timing.json"),
        JSON.stringify(timings) + "\n"
      );
    } catch (_) {
      // ignore
    }
  }

  // kill any outstanding stats reporter if it hasn't finished yet
  stopMetrics();

  if (code) {
    itWorked = false;
  }

  if (itWorked) {
    log.info("ok");
  } else if (code) {
    log.verbose("code", code);
  }

  if (
    appframe.config.loaded &&
    appframe.config.get("timing") &&
    !wroteLogFile
  ) {
    writeLogFile();
  }

  if (wroteLogFile) {
    if (log.levels[log.level] <= log.levels.error) {
      console.error("");
    }

    log.error(
      "",
      [
        "A complete log of this run can be found in:",
        "    " + getLogFile()
      ].join("\n")
    );

    wroteLogFile = false;
  }

  const doExit = appframe.config.loaded && appframe.config.get("_exit");
  if (doExit) {
    // actually exit.
    if (exitCode === 0 && !itWorked) {
      exitCode = 1;
    }

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } else {
    itWorked = false; // ready for next exit
  }
});

function exit(code, noLog) {
  exitCode = exitCode || process.exitCode || code;

  const doExit = appframe.config.loaded ? appframe.config.get("_exit") : true;
  log.verbose("exit", [code, doExit]);
  if (log.level === "silent") {
    noLog = true;
  }

  if (rollbacks.length) {
    // TODO: handle rollbacks
  } else if (code && !noLog) {
    writeLogFile();
  } else {
    reallyExit();
  }

  function reallyExit(er) {
    if (er && !code) code = typeof er.errno === "number" ? er.errno : 1;

    itWorked = !code;

    // Exit directly -- nothing in the CLI should still be running in the
    // background at this point, and this makes sure anything left dangling
    // for whatever reason gets thrown away, instead of leaving the CLI open
    //
    // Commands that expect long-running actions should just delay `cb()`
    process.stdout.write("", () => {
      process.exit(code);
    });
  }
}

function errorHandler(err) {
  log.disableProgress();
  if (!appframe.config || !appframe.config.loaded) {
    // logging won't work unless we pretend that it's ready
    err = err || new Error("Exit prior to config file resolving.");
  }

  if (cbCalled) {
    err = err || new Error("Callback called more than once.");
  }

  cbCalled = true;
  if (!err) {
    return exit(0);
  }

  if (typeof err === "string") {
    log.error("", err);
    return exit(1, true);
  } else if (!(err instanceof Error)) {
    log.error("weird error", err);
    return exit(1, true);
  }

  const errCode = err.code || err.message.match(/^(?:Error: )?(E[A-Z]+)/);
  if (errCode && !err.code) {
    err.code = errCode;
  }

  ["type", "stack", "statusCode", "pkgid"].forEach(
    prop => err[prop] && log.verbose(prop, err[prop])
  );

  log.verbose("cwd", process.cwd());

  const os = require("os");
  log.verbose("", `${os.type()} ${os.release()}`);
  log.verbose("argv", process.argv.map(JSON.stringify).join(" "));
  log.verbose("node", process.version);
  log.verbose("appframe ", `v${appframe.version}`);

  ["file", "path", "code", "errno", "syscall"].forEach(
    prop => err[prop] && log.error(prop, err[prop])
  );

  const message = errorMessage(err);
  message.summary
    .concat(message.detail)
    .forEach(errLine => log.error.apply(log, errLine));

  if (appframe.config && appframe.config.get("json")) {
    const error = {
      error: {
        code: err.code,
        summary: messageText(message.summary),
        detail: messageText(message.detail)
      }
    };

    console.log(JSON.stringify(error, null, 2));
  }

  exit(typeof err.errno === "number" ? err.errno : 1);
}

function messageText(msg) {
  return msg.map(line => line.slice(1).join(" ")).join("\n");
}

function writeLogFile() {
  if (wroteLogFile) return;

  const os = require("os");

  try {
    mkdirp.sync(path.resolve(appframe.config.get("cache"), "_logs"));
    let logOutput = "";
    log.record.forEach(function(message) {
      let pref = [message.id, message.level];
      if (message.prefix) {
        pref.push(message.prefix);
      }
      pref = pref.join(" ");

      message.message
        .trim()
        .split(/\t?\n/)
        .map(line => `${pref} ${line}`.trim())
        .forEach(function(line) {
          logOutput += line + os.EOL;
        });
    });

    writeFileAtomic.sync(getLogFile(), logOutput);

    // truncate once it's been written
    log.record.length = 0;
    wroteLogFile = true;
  } catch (ex) {
    // ignore
  }
}

module.exports = errorHandler;
module.exports.exit = exit;
