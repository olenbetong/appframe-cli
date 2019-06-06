const dotenv = require("dotenv");

dotenv.config();

const { APPFRAME_LOGIN: user, APPFRAME_PWD: password } = process.env;

module.exports = {
  mode: "production",
  targets: [
    // ['./test/article-style.sass', 'publish-test', 'article-style'],
    // { source: './test/site-script.min.js', target: 'site-script.min.js', type: 'site-script' },
    // { source: './test/site-style.less', target: 'site-style.less', type: 'site-style' },
    {
      source: "./test/1.bundle.min.js",
      target: "test/tester.min.js",
      targetArticleId: "publish-test",
      type: "article-script"
    },
    {
      source: "./test/article-script.min.js",
      target: "article-script.min.js",
      targetArticleId: "publish-test",
      type: "article-script"
    }
  ],
  hostname: "synergi.olenbetong.no",
  password,
  user
};
