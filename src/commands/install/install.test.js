const installCommand = require('./index');
const { getRequiredCommandParameters } = require('./common');
const { installLocalComponent } = require('./install-components');
const { login } = require('../../appframe');
const dotenv = require('dotenv');

dotenv.load();

const {
  APPFRAME_LOGIN: user,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname
} = process.env;

test('installs without error', async () => {
	await login(hostname, user, password);
	await installLocalComponent(hostname);
});

test('install from command line', async () => {
  await installCommand({
    domain: hostname,
    hostname,
    user,
    password
  });
});

test('get missing parameters', async () => {
  let readCount = 0;
  const values = [hostname, '', user, password];
  const mockReadline = {
    close: () => null,
    questionAsync: () => Promise.resolve(values[readCount++])
  };

  const config = await getRequiredCommandParameters({}, mockReadline);

  expect(config).toEqual({
    domain: hostname,
    hostname,
    user,
    password
  });
});