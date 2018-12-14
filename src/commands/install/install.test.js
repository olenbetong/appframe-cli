const installCommand = require('./index');
const { getRequiredCommandParameters } = require('./common');
const { InstallClient } = require('./client');
const dotenv = require('dotenv');

dotenv.load();

const {
  APPFRAME_LOGIN: username,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname
} = process.env;

describe('Install command', () => {
  const client = new InstallClient({ hostname, password, username });

  test('installs without error', async () => {
    await client.login();
    await client.installLocalComponent(hostname);
  });
  
  test('install from command line', async () => {
    await installCommand({
      domain: hostname,
      hostname,
      username,
      password
    });
  });
  
  test('get missing parameters', async () => {
    let readCount = 0;
    const values = [hostname, '', username, password];
    const mockReadline = {
      close: () => null,
      questionAsync: () => Promise.resolve(values[readCount++])
    };
  
    const config = await getRequiredCommandParameters({}, mockReadline);
  
    expect(config).toEqual({
      domain: hostname,
      hostname,
      username,
      password
    });
  });
})