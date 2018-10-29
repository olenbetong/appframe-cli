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