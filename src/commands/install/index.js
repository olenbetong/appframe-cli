const { installLocalComponent } = require('./install-components');
const { login } = require('../../appframe');
const { getRequiredCommandParameters } = require('./common');

async function install(args) {
	let {
		domain,
		hostname,
		password,
		user
	} = await getRequiredCommandParameters(args);

	if (await login(domain, user, password)) {
		console.log(`Adding required data sources to '${hostname}'...`)
		await installLocalComponent(hostname, domain);
	} else {
		console.error('Login failed.');
	}
}

module.exports = install;
