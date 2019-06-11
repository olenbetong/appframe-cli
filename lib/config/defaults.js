const osenv = require("osenv");
const path = require("path");

const temp = osenv.tmpdir();
let home = osenv.home();
const uidOrPid = process.getuid ? process.getuid() : process.pid;

if (home) {
  process.env.HOME = home;
} else {
  home = path.resolve(temp, "appframe-" + uidOrPid);
}

const cacheExtra =
  process.platform === "win32" ? "appframe-cache" : ".appframe";
const cacheRoot = (process.platform === "win32" && process.env.APPDATA) || home;
const cache = path.resolve(cacheRoot, cacheExtra);

let globalPrefix;

if (process.env.PREFIX) {
  globalPrefix = process.env.PREFIX;
} else if (process.platform === "win32") {
  // c:\node\node.exe --> prefix=c:\node\
  globalPrefix = path.dirname(process.execPath);
} else {
  // /usr/local/bin/node --> prefix=/usr/local
  globalPrefix = path.dirname(path.dirname(process.execPath));

  // destdir only is respected on Unix
  if (process.env.DESTDIR) {
    globalPrefix = path.join(process.env.DESTDIR, globalPrefix);
  }
}

module.exports.defaults = {
  cache,
  componentHostname: false,
  globalconfig: path.resolve(globalPrefix, "etc", "appframerc"),
  server: "https://jsdev.obet.no/",
  userconfig: path.resolve(home, ".appframerc")
};
