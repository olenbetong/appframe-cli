module.exports = {
  env: {
    node: true,
    "jest/globals": true,
    es6: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  plugins: ["prettier", "jest"],
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "react/prop-types": "off",
    "no-console": "off",
    "no-empty": "warn",
  },
};
