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
		--source .................. script/style file to publish
		--target .................. script and target to publish (can be array of targets)
		--type ....................
		--user .................... username for the SQL server

		If a config file is used, a 'targets' option may be used to publish
		multiple files at a time. It can be either an object with source, target,
		type and (optional) hostname keys, or an array with this shape:
		[source, target, type, (optional) hostname]. It may also be an array of
		these items.

			Example 1:
			{ source: './demo.js', target: '/module/demo.js', type: 'component-global' }

			Example 2:
			['./demo.js', 'demo.js', 'site-script']

			Example 3:
			[
				{ source: './demo.js', target: '/path/to/module/demo.js', type: 'component-global' },
				['./dist/bundle.min.js', '[article-name]/bundle.min.js', 'article-script', 'another-hostname.com']
			]
	`
}

function help(args) {
	const subCmd = args._[0] === 'help'
		? args._[1]
		: args._[0];
	
	console.log(menus[subCmd] || menus.main);
}

module.exports = help;
