const glob = require("glob");
const rimraf = require("rimraf");
const path = require("path");
const abbrev = require("abbrev");
const EventEmitter = require("events").EventEmitter;
const log = require("npmlog");
const inspect = require("util").inspect;
const startMetrics = require("./utils/metrics.js").start;
const { aliases, cmdList } = require("./config/cmd-list.js");
const appframeconf = require("./config/core.js");

const aliasNames = Object.keys(aliases);
const fullList = cmdList.concat(aliasNames);
const abbrevs = abbrev(fullList);
const commandCache = {};
const appframe = new EventEmitter();
let loaded = false;

appframe.config = {
  loaded: false,
  get: function() {
    throw new Error("appframe.load() required");
  },
  set: function() {
    throw new Error("appframe.load() required");
  }
};

appframe.commands = {};
appframe.rollbacks = [];

let loadPromise;

appframe.load = async function(cli) {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise(async function(resolve) {
    log.pause();

    const config = await appframeconf.load(cli);
    appframe.config = config;

    if (config.get("timing") && config.get("loglevel") === "notice") {
      log.level = "timing";
    } else {
      log.level = config.get("loglevel");
    }

    log.heading = config.get("heading") || "appframe";
    log.stream = config.get("logstream");

    const color = config.get("color");
    switch (color) {
      case "always":
        appframe.color = true;
        break;
      case false:
        appframe.color = false;
        break;
      default:
        appframe.color = process.stdout.isTTY && process.env["TERM"] !== "dumb";
        break;
    }

    if (appframe.color) {
      log.enableColor();
    } else {
      log.disableColor();
    }

    if (
      config.get("progress") &&
      process.stderr.isTTY &&
      process.env["TERM"] !== "dumb"
    ) {
      log.enableProgress();
    } else {
      log.disableProgress();
    }

    const logFilePattern = path.resolve(appframe.cache, "_logs", "*-debug.log");
    glob(logFilePattern, function(err, files) {
      if (err) return;

      while (files.length >= config.get("logs-max")) {
        rimraf.sync(files[0]);
        files.splice(0, 1);
      }
    });

    log.resume();
    startMetrics();

    resolve();
  });

  loadPromise.then(function() {
    appframe.config.loaded = true;
    loaded = true;
  });

  return loadPromise;
};

appframe.deref = function(cmd) {
  if (!cmd) {
    return "";
  }
  if (cmd.match(/[A-Z]/)) {
    cmd = cmd.replace(/([A-Z])/g, match => "-" + match.toLowerCase());
  }

  let actual = abbrevs[cmd];
  while (aliases[actual]) {
    actual = aliases[actual];
  }

  return actual;
};

function addCommand(c) {
  Object.defineProperty(appframe.commands, c, {
    get: function() {
      if (!loaded) {
        throw new Error(
          `Call appframe.load(config) before using this command.`
        );
      }

      const actual = appframe.deref(c);
      appframe.command = c;
      if (commandCache[actual]) {
        return commandCache[actual];
      }

      const cmd = require(path.join(__dirname, actual + ".js"));
      commandCache[actual] = function(...args) {
        // Options are prefixed by a hyphen-minus (-, \u2d).
        // Other dash-type chars look similar but are invalid.
        Array(args[0]).forEach(function(arg) {
          if (/^[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/.test(arg)) {
            log.error(
              "arg",
              "Argument starts with non-ascii dash, this is probably invalid:",
              arg
            );
          }
        });

        cmd.apply(appframe, args);
      };

      Object.keys(cmd).forEach(function(key) {
        commandCache[actual][key] = cmd[key];
      });

      return commandCache[actual];
    }
  });
}

for (let cmd in abbrevs) {
  addCommand(cmd);
}

Object.defineProperty(appframe, "cache", {
  get: () => appframe.config.get("cache"),
  set: cache => appframe.config.set("cache", cache)
});

let tmpFolder;
const rand = require("crypto")
  .randomBytes(4)
  .toString("hex");

Object.defineProperty(appframe, "tmp", {
  get: function() {
    if (!tmpFolder) {
      tmpFolder = `appframe-${process.pid}-${rand}`;
    }
    return path.resolve(appframe.config.get("tmp"), tmpFolder);
  }
});

Object.getOwnPropertyNames(appframe.commands).forEach(function(cmd) {
  if (appframe.hasOwnProperty(cmd) || cmd === "config") return;

  Object.defineProperty(appframe, cmd, {
    get: () => (...args) => {
      args = args.slice(0);

      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }

      return appframe.commands[cmd](args);
    },
    enumerable: false,
    configurable: true
  });
});

try {
  const pkg = require("../package.json");
  appframe.name = pkg.name;
  appframe.version = pkg.version;
} catch (ex) {
  try {
    log.info("error reading version", ex);
  } catch (err) {
    // ignore
  }
  appframe.version = ex;
}

process.on("log", function(level, ...args) {
  try {
    return log[level](...args);
  } catch (ex) {
    log.verbose(`attempt to log ${inspect(args)} crashed: ${ex.message}`);
  }
});

module.exports = appframe;
