const { getSourceData } = require('./common');
const fs = require('fs');
const publishCommand = require('./index');
const { publishToArticleScript, publishToArticleStyle } = require('./article');
const { publishToGlobalComponent, publishToSiteComponent } = require('./component');
const { publishToSiteScript, publishToSiteStyle } = require('./site');
const { getItem, login } = require('../../appframe');
const dotenv = require('dotenv');

dotenv.load();

const sourceData = Math.random().toString(32).slice(2);

const {
  APPFRAME_LOGIN: user,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname
} = process.env;

const config = {
  domain: hostname,
  hostname,
  password,
  sourceData,
  target: 'jest-test-module.min.js',
  user,
};

test('can login', async () => {
  const result = await login(hostname, user, password);

  expect(result).toEqual(true);
});

test('can publish to global component', async () => {
  const resultTest = await publishToGlobalComponent({
    ...config,
    mode: 'test',
    type: 'component-global',
  });

  expect(resultTest).toEqual(true);

  const resultProd = await publishToGlobalComponent({
    ...config,
    mode: 'production',
  });

  expect(resultProd).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'components-editor',
    dataObjectId: 'dsComponent',
    domain: hostname,
    filter: `[Path] = '${config.target}'`,
  });

  const [path,,content,contentTest,] = publishedCode[0];

  expect(contentTest).toEqual(sourceData);
  expect(content).toEqual(sourceData);
});

test('can publish to site component', async () => {
  const resultTest = await publishToSiteComponent({
    ...config,
    mode: 'test'
  });

  expect(resultTest).toEqual(true);

  const resultProd = await publishToSiteComponent({
    ...config,
    mode: 'production',
  });

  expect(resultProd).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'components',
    dataObjectId: 'dsSiteComponents',
    domain: hostname,
    filter: `[HostName] = '${config.hostname}' AND [Path] = '${config.target}'`,
  });

  const [primKey,,path,content,contentTest] = publishedCode[0];

  expect(contentTest).toEqual(sourceData);
  expect(content).toEqual(sourceData);
});

test('can publish to site script', async () => {
  const resultTest = await publishToSiteScript({
    ...config,
    mode: 'test',
  });

  expect(resultTest).toEqual(true);

  const resultProd = await publishToSiteScript({
    ...config,
    mode: 'production',
  });

  expect(resultProd).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'sitesetup-script',
    dataObjectId: 'dsScript',
    domain: hostname,
    filter: `[Hostname] = '${hostname}' AND [Name] = '${config.target}'`
  });

  const [,content,contentTest,] = publishedCode[0];

  expect(content).toEqual(sourceData);
  expect(contentTest).toEqual(sourceData);
});

test('can publish to site style', async () => {
  const resultTest = await publishToSiteStyle({
    ...config,
    mode: 'test',
    target: 'jest-test-module.min.css',
  });

  expect(resultTest).toEqual(true);

  const resultProd = await publishToSiteStyle({
    ...config,
    mode: 'production',
    target: 'jest-test-module.min.css',
  });

  expect(resultProd).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'sitesetup-stylesheet',
    dataObjectId: 'dsStylesheet',
    domain: hostname,
    filter: `[Hostname] = '${hostname}' AND [Name] = 'jest-test-module.min.css'`,
  });

  const [,,content,contentTest] = publishedCode[0];

  expect(content).toEqual(sourceData);
  expect(contentTest).toEqual(sourceData);
});

test('can publish to article script', async () => {
  const result = await publishToArticleScript({
    ...config,
    targetArticleId: 'publish-test'
  });

  expect(result).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'appdesigner-script',
    dataObjectId: 'dsScripts',
    domain: hostname,
    filter: `[Hostname] = '${hostname}' AND [ArticleID] = 'publish-test' AND [ID] = '${config.target}'`
  });

  const [,,,content] = publishedCode[0];

  expect(content).toEqual(sourceData);
});

test('can publish to article style', async () => {
  const sourceData = `.test { content: '${config.sourceData}'; }`
  const result = await publishToArticleStyle({
    ...config,
    target: 'publish-test',
    source: 'jestTest',
    sourceData,
  });
  
  expect(result).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'appdesigner-css',
    dataObjectId: 'dsArticle',
    domain: hostname,
    filter: `[HostName] = '${hostname}' AND [ArticleID] = 'publish-test'`
  });

  const content = publishedCode[0][3];
  const idx = content.indexOf(sourceData);

  expect(idx).toBeGreaterThan(0);
});

test('can publish from command line', async () => {
  fs.writeFileSync('./test/testsource.js', sourceData, { flag: 'w' });
  await publishCommand({ config: './test/test.config' });
});