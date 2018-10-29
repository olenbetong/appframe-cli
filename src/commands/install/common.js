const readline = require('readline-promise');

async function getInputOrDefault(input, question, defaultValue) {
	let q = question + ' ';

	if (defaultValue) {
		q = `${q}(${defaultValue}) `;
	}

	let answer = await input.questionAsync(q);

	if (!answer && defaultValue) {
		answer = defaultValue;
	} else if (!answer) {
		console.warn('Please enter a value');

		return await getInputOrDefault(input, question, defaultValue);
	}

	return answer;
}

async function getRequiredCommandParameters(args, reader) {
	const rl = reader || readline.default.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true
	});

	const config = { ...args };

	if (!config.hostname) {
		config.hostname = await getInputOrDefault(rl, 'Hostname?', config.domain);
	}

	if (!config.domain) {
		config.domain = await getInputOrDefault(rl, 'Domain?', config.hostname);
	}

	if (!config.user) {
		config.user = await getInputOrDefault(rl, 'Login?');
	}

	if (!config.password) {
		config.password = await getInputOrDefault(rl, 'Password?');
	}

	rl.close();

	return config;
}

module.exports = {
	getRequiredCommandParameters
}
