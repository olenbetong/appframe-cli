const { installLocalComponent } = require('./install-components');
const { login } = require('../../appframe');

async function install(args) {
	const {
		hostname,
		password,
		user,
	} = args;

	if (!hostname || !password || !user) {
		console.error(`Hostname, username and password must be specified to install data sources`);
		return;
	}

	if (await login(hostname, user, password)) {
		console.log(`Adding required data sources to '${hostname}'...`)
		await installLocalComponent(hostname);
	}
}

module.exports = install;
