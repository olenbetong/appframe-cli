const { getSourceData } = require('./common');
const { publishToGlobalComponent } = require('./component');
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
  type: 'component-global',
  user,
};

test('can login', async () => {
  const result = await login(hostname, user, password);

  expect(result).toEqual(true);
});

test('can publish to global component', async () => {
  const resultTest = await publishToGlobalComponent({
    ...config,
    mode: 'test'
  });

  expect(resultTest).toEqual(true);

  const resultProd = await publishToGlobalComponent({
    ...config,
    mode: 'production'
  });

  expect(resultProd).toEqual(true);

  const publishedCode = await getItem({
    articleId: 'components-editor',
    dataObjectId: 'dsComponent',
    domain: hostname,
    filter: `[Path] = '${config.target}'`,
  });

  const [path,,content,contentTest,primKey] = publishedCode[0];

  expect(contentTest).toEqual(sourceData);
});
