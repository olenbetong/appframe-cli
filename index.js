const minimist = require('minimist');

function cli() {
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
            require('./cmds/help')(args);
            break;
        case 'today':
            require('./cmds/today')(args);
            break;
        case 'version':
            require('./cmds/version')(args);
            break;
        case 'publish':
            require('./cmds/publish')(args);
            break;
        default:
            console.error(`"${cmd}" is not a valid command!`);
            break;
    }

    console.log(args);
}

module.exports = cli;
