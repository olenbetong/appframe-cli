const { InstallClient } = require('./client');
const { getRequiredCommandParameters } = require('./common');

async function install(args) {
	let {
		domain,
		hostname,
		password,
		username
	} = await getRequiredCommandParameters(args);

	const client = new InstallClient({ hostname: domain, password, username });
	const auth = await client.login();

	if (auth.success) {
		console.log(`Adding required data sources to '${hostname}'...`)
		await client.installLocalComponent(hostname);
	} else {
		console.error('Login failed.');
	}
}

module.exports = install;
