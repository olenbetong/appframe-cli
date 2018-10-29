const { installLocalComponent } = require('./install-components');
const { login } = require('../../appframe');

async function install(args) {
	let {
		domain,
		hostname,
		password,
		user,
	} = args;

	if (!hostname && domain) {
		hostname = domain;
	} if (!domain && hostname) {
		domain = hostname;
	}

	if (!hostname || !password || !user) {
		console.error(`Hostname, username and password must be specified to install data sources`);
		return;
	}

	if (await login(domain, user, password)) {
		console.log(`Adding required data sources to '${hostname}'...`)
		await installLocalComponent(hostname, domain);
	}
}

module.exports = install;
