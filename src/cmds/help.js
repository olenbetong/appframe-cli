const menus = {
    main: `
        appframe [command] <options>

        publish ................ publish module according to configuration
        version ................ show package version
        help ................... show help menu for a command
        `,
        publish: `
        appframe publish <options>
        
        --article ................. article to publish to (if type is script)
        --config .................. config file to use
        --database ................ database to publish to
        --hostname ................ website hostname(s) to publish to
        --password ................ password for the SQL server
        --production, -p .......... publish to production
        --server .................. SQL server Appframe is running on
        --target .................. script and target to publish (can be array of targets)
        --user .................... username for the SQL server

        Target options:
        hostname (optional) ....... hostname to publish to (if different from hostname option)
        source .................... the file whose contents will be published
        target .................... name of the publish target
        type ...................... type of the publish target (default: component-global)
    `
}

function help(args) {
    const subCmd = args._[0] === 'help'
        ? args._[1]
        : args._[0];
    
    console.log(menus[subCmd] || menus.main);
}

module.exports = help;
