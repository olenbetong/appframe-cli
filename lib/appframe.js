const gfs = require("graceful-fs");
const fs = gfs.gracefulify("fs");
const path = require("path");
const abbrev = require("abbrev");
const EventEmitter = require("events").EventEmitter;
const log = require("npmlog");
const inspect = require("util").inspect;
const { aliases, cmdList } = require("./config/cmd-list");
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

  loadPromise = new Promise(async resolve => {
    appframe.config = await appframeconf.load(cli);

    resolve(appframe.config);
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

for (let c in abbrevs) {
  Object.defineProperty(appframe.commands, c, {
    get: function() {
      if (!loaded) {
        throw new Error(
          `Call appframe.load(config) before using this command.`
        );
      }

      var actual = appframe.deref(c);
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

try {
  const pkg = require("../package.json");
  appframe.name = pkg;
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
