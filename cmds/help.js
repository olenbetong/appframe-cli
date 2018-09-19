const menus = {
    main: `
        appframe [command] <options>

        publish ................ publish module according to configuration
        version ................ show package version
        help ................... show help menu for a command
    `,
    publish: `
        appframe publish <options>

        --production, --prod ...... publish to production
        --server, -s .............. SQL server Appframe is running on
        --database, -d ............ database to publish to
        --user, -u ................ username for the SQL server
        --password, -p ............ password for the SQL server
        --source .................. the file that should be published
        --target .................. name of the component to publish to
    `
}

function help(args) {
    const subCmd = args._[0] === 'help'
        ? args._[1]
        : args._[0];
    
    console.log(menus[subCmd] || menus.main);
}

module.exports = help;
