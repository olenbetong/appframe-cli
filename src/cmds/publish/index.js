const { resolve } = require('path');
const { login } = require('../../appframe');
const { publishToGlobalComponent, publishToSiteComponent } = require('./component');
const { publishToSiteScript, publishToSiteStyle } = require('./site');
const { publishToArticleScript } = require('./article');

const types = [
	'article-script',
	'article-style',
	'component-global',
	'component-site',
	'site-script',
	'site-style'
];

function getConfigFromArgs(args) {
	const config = {};
	const potentialArgs = [
		'article',
		'database',
		'hostname',
		'password',
		'production',
		'server',
		'source',
		'target',
		'user',
	];

	for (let arg of potentialArgs) {
		if (args[arg]) {
			config[arg] = args[arg];
		}
	}

	if (args.production === true || args.p === true) {
		config.production = true;
	}

	if (typeof args.type === 'string') {
		if (!types.includes(args.type.toLowerCase())) {
			throw new Error(`'${args.type}' is not a valid type.`);
		} else {
			config.type = args.type.toLowerCase();
		}
	}

	return config;
}

async function publishToArticleStyle(config) {

}

function validateConfiguration(config) {

}

async function publishItem(item) {
	const { hostname, source, type, target } = item;

	console.log(`Publishing '${source}' to ${type} '${target}' in ${hostname}...`);

	if (item.type === 'article-script') {
		return await publishToArticleScript(item);
	} else if (item.type === 'article-style') {
		return await publishToArticleStyle(item);
	} else if (item.type === 'component-global') {
		return await publishToGlobalComponent(item);
	} else if (item.type === 'component-site') {
		return await publishToSiteComponent(item);
	} else if (item.type === 'site-script') {
		return await publishToSiteScript(item);
	} else if (item.type === 'site-style') {
		return await publishToSiteStyle(item);
	} else {
		console.error(`Type '${type}' is not supported.`);

		return Promise.resolve(false);
	}
}

async function publishItemFromArray(array, fallbackHostname) {
	const [source, target, type, hostname] = array;
	const item = {
		hostname,
		source,
		target,
		type
	};

	if (type.substring(0, 'article'.length) === 'article') {
		const idx = target.indexOf('/');

		if (idx > 0) {
			item.target = target.substring(idx + 1);
			item.targetArticleId = target.substring(0, idx);
		} else {
			throw new Error('To publish article scripts or styles with array shorthand, use "articleName/target" as the target.');
		}
	}

	if (!item.hostname) {
		item.hostname = fallbackHostname;
	}

	return await publishItem(item);
}

async function publish(args) {
	const configFromFile = args.config ? require(resolve(args.config)) : {};
	const config = Object.assign(
		{
			production: false,
			type: 'component'
		},
		configFromFile,
		getConfigFromArgs(args)
	);

	if (await login(config.hostname, config.user, config.password)) {
		validateConfiguration(config);
		
		const { hostname, target, source, type } = config;
		
		let successCount = 0;
		let count = 0;
	
		if (target && source && type) {
			count++;
			let success = await publishItem({ hostname, source, target, type });

			if (success) {
				successCount++;
			}
		}

		if (config.targets instanceof Array && config.targets.length > 0) {

			if (config.targets[0] instanceof Array || typeof config.targets[0] === 'object') {
				// config is array of publish items
				const { hostname } = config;
				count += config.targets.length;

				for (let item of config.targets) {
					let success = false;
					if (item instanceof Array) {
						success = await publishItemFromArray(item, hostname);
					} else {
						success = await publishItem({ hostname, ...item });
					}

					if (success) {
						successCount++;
					}
				}
			} else {
				// config is a single publish item
				count++;
				let success = await publishItem(item);
			}

		} else if (typeof config.targets === 'object') {
			publishItem(config.targets);
		}

		if (successCount === 0) {
			console.log('Nothing published successfully. Epic fail :(');
		} else {
			console.log(`Publish completed. ${successCount} of ${count} items published successfully.`);
		}
	}
}

module.exports = publish;
