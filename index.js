const minimist = require('minimist');

async function cli() {
	const args = minimist(process.argv.slice(2));
	let cmd = (args._[0] || 'help').toLowerCase();

	if (args.version || args.v) {
		cmd = 'version';
	}

	if (args.help || args.h) {
		cmd = 'help';
	}

	switch (cmd) {
		case 'help':
			require('./src/cmds/help')(args);
			break;
		case 'today':
			require('./src/cmds/today')(args);
			break;
		case 'version':
			require('./src/cmds/version')(args);
			break;
		case 'publish':
			await require('./src/cmds/publish')(args);
			break;
		default:
			console.error(`"${cmd}" is not a valid command!`);
			break;
	}

	console.log(args);
}

module.exports = cli;
