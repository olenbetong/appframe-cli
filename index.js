const minimist = require("minimist");

async function cli() {
  const args = minimist(process.argv.slice(2));
  let cmd = (args._[0] || "help").toLowerCase();

  if (args.version || args.v) {
    cmd = "version";
  }

  if (args.help || args.h) {
    cmd = "help";
  }

  switch (cmd) {
    case "help":
      require("./src/commands/help")(args);
      break;
    case "version":
      require("./src/commands/version")(args);
      break;
    case "publish":
      await require("./src/commands/publish")(args);
      break;
    case "delete":
      await require("./src/commands/delete")(args);
      break;
    default:
      console.error(`"${cmd}" is not a valid command!`);
      break;
  }
}

module.exports = cli;
