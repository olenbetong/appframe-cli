module.exports = {
  env: {
    node: true,
    "jest/globals": true,
    commonjs: true,
    es6: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["prettier", "jest"],
  rules: {
    "react/prop-types": "off",
    "no-console": "off",
  },
};
