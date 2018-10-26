test('help outputs documentation for the right command', () => {
	let outputData = '';
	const storeLog = inputs => (outputData += inputs);

	console["log"] = jest.fn(storeLog);

	const help = require('./help');

	help({ _: ['help', 'publish']});

	expect(outputData).toContain('appframe publish <options>');

	outputData = '';

	help({ _: ['publish'] });

	expect(outputData).toContain('appframe publish <options>');
});

test('help outputs commands if no command is specified', () => {
	let outputData = '';
	const storeLog = inputs => (outputData += inputs);

	console["log"] = jest.fn(storeLog);

	const help = require('./help');

	help({ _: ['help'] });

	expect(outputData).toContain('appframe [command] <options>');
});

test('version outputs version', () => {
	let outputData = '';
	const storeLog = inputs => (outputData += inputs);

	console["log"] = jest.fn(storeLog);

	const version = require('./version');
	const { version: currentVersion } = require('../../package.json');
	version();

	expect(outputData).toContain(`v${currentVersion}`);
})