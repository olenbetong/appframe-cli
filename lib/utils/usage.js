const aliases = require("../config/cmd-list").aliases;

module.exports = function usage(command, text, options) {
  const post = Object.keys(aliases).filter(alias => aliases[alias] === command);

  if (options || post.length > 0) {
    text += "\n\n";
  }

  if (post.length === 1) {
    text += "alias: " + post.join(", ");
  } else if (post.length > 1) {
    text += "aliases: " + post.join(", ");
  }

  if (options) {
    if (post.length > 0) {
      text += "\n";
    }

    text += "common options: " + options;
  }
};
