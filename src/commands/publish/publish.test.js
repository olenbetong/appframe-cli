const fs = require("fs");
const publishCommand = require("./index");
const { PublishClient } = require("./client");
const dotenv = require("dotenv");

dotenv.config();

const sourceData = Math.random().toString(32).slice(2);

const {
  APPFRAME_LOGIN: username,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname,
  APPFRAME_DEVHOST: devHost,
} = process.env;

const config = {
  domain: hostname,
  hostname,
  password,
  sourceData,
  target: "jest-test-module.min.js",
  username,
};

describe("PublishClient", () => {
  const client = new PublishClient({ hostname: devHost, password, username });

  test("can login", async () => {
    const result = await client.login();

    expect(result.success).toEqual(true);
  });

  test("can publish to global component", async () => {
    const resultTest = await client.publishToGlobalComponent({
      ...config,
      mode: "test",
      type: "component-global",
    });

    expect(resultTest).toEqual(true);

    const resultProd = await client.publishToGlobalComponent({
      ...config,
      mode: "production",
    });

    expect(resultProd).toEqual(true);

    const publishedCode = await client.retrieve("stbv_WebSiteCMS_GlobalComponents", {
      fields: ["Path", "Content", "ContentTest"],
      filterString: `[Path] = '${config.target}'`,
    });

    const { Content, ContentTest } = publishedCode[0];

    expect(ContentTest).toEqual(sourceData);
    expect(Content).toEqual(sourceData);
  });

  test("can publish to site component", async () => {
    const resultTest = await client.publishToSiteComponent({
      ...config,
      mode: "test",
    });

    expect(resultTest).toEqual(true);

    const resultProd = await client.publishToSiteComponent({
      ...config,
      mode: "production",
    });

    expect(resultProd).toEqual(true);

    const publishedCode = await client.retrieve("stbv_WebSiteCMS_Components", {
      fields: ["HostName", "Path", "Content", "ContentTest"],
      filterString: `[HostName] = '${config.hostname}' AND [Path] = '${config.target}'`,
    });

    const { Content, ContentTest } = publishedCode[0];

    expect(ContentTest).toEqual(sourceData);
    expect(Content).toEqual(sourceData);
  });

  test("can publish to site script", async () => {
    const resultTest = await client.publishToSiteScript({
      ...config,
      mode: "test",
    });

    expect(resultTest).toEqual(true);

    const resultProd = await client.publishToSiteScript({
      ...config,
      mode: "production",
    });

    expect(resultProd).toEqual(true);

    const publishedCode = await client.retrieve("stbv_WebSiteCMS_Scripts", {
      fields: ["HostName", "Name", "ScriptContent", "ScriptContentTest"],
      filterString: `[Hostname] = '${hostname}' AND [Name] = '${config.target}'`,
    });

    const { ScriptContent, ScriptContentTest } = publishedCode[0];

    expect(ScriptContent).toEqual(sourceData);
    expect(ScriptContentTest).toEqual(sourceData);
  });

  test("can publish to site style", async () => {
    const resultTest = await client.publishToSiteStyle({
      ...config,
      mode: "test",
      target: "jest-test-module.min.css",
    });

    expect(resultTest).toEqual(true);

    const resultProd = await client.publishToSiteStyle({
      ...config,
      mode: "production",
      target: "jest-test-module.min.css",
    });

    expect(resultProd).toEqual(true);

    const publishedCode = await client.retrieve("stbv_WebSiteCMS_Styles", {
      fields: ["Name", "StyleContent", "StyleContentTest"],
      filterString: `[Hostname] = '${hostname}' AND [Name] = 'jest-test-module.min.css'`,
    });

    const { StyleContent, StyleContentTest } = publishedCode[0];

    expect(StyleContent).toEqual(sourceData);
    expect(StyleContentTest).toEqual(sourceData);
  });

  test("can publish to article script", async () => {
    const before = await client.retrieve("stbv_WebSiteCMS_ArticlesScripts", {
      fields: ["HostName", "ArticleID", "ID", "Exclude"],
      filterString: `[Hostname] = '${hostname}' AND [ArticleID] = 'publish-test' AND [ID] = '${config.target}'`,
    });

    const initialExclude = before[0].Exclude;

    const result = await client.publishToArticleScript({
      ...config,
      exclude: !initialExclude,
      targetArticleId: "publish-test",
    });

    expect(result).toEqual(true);

    const publishedCode = await client.retrieve("stbv_WebSiteCMS_ArticlesScripts", {
      fields: ["HostName", "ArticleID", "ID", "Exclude", "Script"],
      filterString: `[Hostname] = '${hostname}' AND [ArticleID] = 'publish-test' AND [ID] = '${config.target}'`,
    });

    const { Exclude, Script } = publishedCode[0];

    expect(Exclude).toEqual(!initialExclude);
    expect(Script).toEqual(sourceData);
  });

  test("can publish to article style", async () => {
    const before = await client.retrieve("stbv_WebSiteCMS_ArticlesStyles", {
      fields: ["HostName", "ArticleID", "ID", "Exclude"],
      filterString: `[Hostname] = '${hostname}' AND [ArticleID] = 'publish-test' AND [ID] = '${config.target}'`,
    });

    const initialExclude = before?.[0]?.Exclude ?? true;

    const sourceData = `.test { content: '${config.sourceData}'; }`;
    const result = await client.publishToArticleStyle({
      ...config,
      exclude: !initialExclude,
      target: "publish-test.less",
      targetArticleId: "publish-test",
      sourceData,
    });

    expect(result).toEqual(true);

    const publishedCode = await client.retrieve("stbv_WebSiteCMS_ArticlesStyles", {
      fields: ["HostName", "ArticleID", "ID", "Style", "Exclude"],
      filterString: `[HostName] = '${hostname}' AND [ArticleID] = 'publish-test'`,
    });

    const { Exclude, Style } = publishedCode[0];

    expect(Exclude).toEqual(!initialExclude);
    expect(Style).toEqual(sourceData);
  });

  // test("can publish from command line", async () => {
  //   fs.writeFileSync("./test/testsource.js", sourceData, { flag: "w" });
  //   await publishCommand({ config: "./test/test.config" });
  // });

  // test("can publish large files", async () => {
  //   const largeConfig = {
  //     ...config,
  //     mode: "test",
  //     target: "jest-test-large-bundle.js",
  //     type: "component-global",
  //   };

  //   const largeSource = fs.readFileSync("./test/large-file.js.map", "utf8");
  //   largeConfig.sourceData = largeSource;

  //   const result = await client.publishToGlobalComponent(largeConfig);

  //   expect(result).toBe(true);
  // });
});
