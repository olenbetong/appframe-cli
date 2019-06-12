var a = require("./lib/appframe.js");
a.load({ loglevel: "silly" }).then(() => {
  a.version();
});
