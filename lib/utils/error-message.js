function errorMessage(err) {
  let short = [];
  let detail = [];

  switch (err.code) {
    case "ENOAUDIT":
      short.push(["audit", err.message]);
      break;
    case "EACCES":
    case "EPERM":
      short.push(["", err]);
      detail.push([
        "",
        [
          "\nThe operation was rejected by your operating system.",
          process.platform === "win32"
            ? "It's possible that the file was already in use (by a text editor or antivirus),\nor that you lack permissions to access it."
            : "It is likely you do not have the permissions to access this file as the current user",
          "\nIf you believe this might be a permissions issue, please double-check the",
          "permissions of the file and its containing directories, or try running",
          "the command again as root/Administrator (though this is not recommended)."
        ].join("\n")
      ]);
      break;
    default:
      short.push(["", err.message || err]);
      break;
  }

  return {
    summary: short,
    detail
  };
}

module.exports = errorMessage;
