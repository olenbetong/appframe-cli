const dotenv = require("dotenv");

dotenv.config();

const { APPFRAME_HOSTNAME: hostname, APPFRAME_LOGIN: user, APPFRAME_PWD: password } = process.env;

const source = "./test/testsource.js";
const target = "jest-test-source.min.js";
const testArticle = "publish-test";

module.exports = {
  mode: "production",
  targets: [
    ["./test/testsource.js", `${testArticle}/test-style`, "article-style"],
    ["./test/testsource.js", `${testArticle}/${target}`, "article-script"],
    { source, target, type: "component-site" },
    { source, target, type: "component-global" },
    { source, target, type: "site-script" }
  ],
  hostname,
  password,
  source,
  target,
  type: "site-style",
  user
};
