const { resolve } = require('path');
const { PublishClient } = require('./client');
const { getSourceData } = require('./common');

const types = [
	'article-script',
	'article-style',
	'component-global',
	'component-site',
	'site-script',
	'site-style'
];

const defaultTargetProperties = {
	mode: 'test',
	type: 'component-global'
};

function getConfigFromArgs(args) {
	const config = {};
	const potentialArgs = [
		'article',
		'domain',
		'exclude',
		'hostname',
		'mode',
		'password',
		'source',
		'target',
		'user',
	];

	for (let arg of potentialArgs) {
		if (args[arg]) {
			config[arg] = args[arg];
		}
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

function mergeTargetWithDefaults(target, defaults) {
	const merged = { ...defaults };

	for (let key of Object.keys(target)) {
		if (typeof target[key] !== 'undefined') {
			merged[key] = target[key];
		}
	}

	return merged;
}

async function getTargetFromConfig(config) {
	const { hostname, mode, target, source, type } = config;

	if (!hostname || !target || !source || !type) {
		return false;
	}

	const rv = {
		hostname,
		mode,
		target,
		source,
		sourceData: await getSourceData(source),
		type
	};

	if (!rv.domain && rv.hostname) {
		rv.domain = rv.hostname;
	} else {
		rv.hostname = rv.domain;
	}

	return mergeTargetWithDefaults(rv, defaultTargetProperties);
}

async function getTargetFromShorthandArray(arr, defaults) {
	try {
		const [source, target, type, hostname] = arr;
		const sourceData = await getSourceData(source);
	
		if (sourceData === false) {
			throw new Error(`Failed to read source '${source}'`);
		}

		const item = {
			hostname,
			source,
			sourceData,
			target,
			type
		};
	
		if (type === 'article-script') {
			const idx = target.indexOf('/');
	
			if (idx > 0) {
				item.target = target.substring(idx + 1);
				item.targetArticleId = target.substring(0, idx);
			} else {
				throw new Error('To publish article scripts with array shorthand, use "articleName/target" as the target.');
			}
		}
	
		return mergeTargetWithDefaults(item, defaults);
	} catch (error) {
		console.error(error.message);

		return false;
	}
}

async function getTargetFromObject(item, defaults) {
	try {
		const newItem = { ...item };
	
		if (!newItem.sourceData) {
			newItem.sourceData = await getSourceData(item.source);
	
			if (newItem.sourceData === false) {
				throw new Error(`Failed to read source '${item.source}'`);
			}
		}
	
		return mergeTargetWithDefaults(newItem, defaults);
	} catch (error) {
		console.error(error.message);

		return false;
	}
}

function validateConfiguration() {
	return true;
}

async function publishItem(client, item) {
	const { hostname, source, type, target } = item;

	console.log(`Publishing '${source}' to ${type} '${target}' in ${hostname}...`);

	if (item.article) {
		item.targetArticleId = item.article;
	}

	if (type === 'article-script') {
		return await client.publishToArticleScript(item);
	} else if (type === 'article-style') {
		return await client.publishToArticleStyle(item);
	} else if (type === 'component-global') {
		return await client.publishToGlobalComponent(item);
	} else if (type === 'component-site') {
		return await client.publishToSiteComponent(item);
	} else if (type === 'site-script') {
		return await client.publishToSiteScript(item);
	} else if (type === 'site-style') {
		return await client.publishToSiteStyle(item);
	} else {
		console.error(`Type '${type}' is not supported.`);

		return Promise.resolve(false);
	}
}

async function publish(args) {
	const configFromFile = args.config ? require(resolve(args.config)) : {};
	const config = Object.assign(
		defaultTargetProperties,
		configFromFile,
		getConfigFromArgs(args)
	);

	if (!config.domain) {
		config.domain = config.hostname;
	}

	const client = new PublishClient({
		hostname: config.domain,
		password: config.password,
		username: config.user,
	});

	const auth = await client.login(config.domain, config.user, config.password);

	if (auth.success) {
		validateConfiguration(config);
		
		const { domain, hostname, mode, type } = config;
		const defaults = { ...defaultTargetProperties };

		if (domain) defaults.domain = domain;
		if (hostname) defaults.hostname = hostname;
		if (mode) defaults.mode = mode;
		if (type) defaults.type = type;

		if (!domain && hostname) defaults.domain = hostname;
		if (!hostname && domain) defaults.hostname = domain;

		const targets = [];
		const targetFromConfig = await getTargetFromConfig(config);

		if (targetFromConfig !== false) {
			targets.push(targetFromConfig);
		}

		if (config.targets instanceof Array && config.targets.length > 0) {

			if (config.targets[0] instanceof Array || typeof config.targets[0] === 'object') {
				// config is array of publish items
				for (let item of config.targets) {
					if (item instanceof Array) {
						const target = await getTargetFromShorthandArray(item, defaults);

						if (target !== false) {
							targets.push(target);
						}
					} else {
						const target = await await getTargetFromObject(item, defaults);

						if (target !== false) {
							targets.push(target);
						}
					}
				}
			} else {
				// config is a single array shorthand target
				const target = await getTargetFromShorthandArray(config.targets[0], defaults);
				
				if (target !== false) {
					targets.push(target);
				}
			}
		} else if (typeof config.targets === 'object') {
			// config is a single object target
			const target = await getTargetFromObject(config.targets, defaults);
			if (target !== false) {
				targets.push(target);
			}
		}

		if (targets.length === 0) {
			console.warn('No valid targets found for publishing.');
			return;
		}

		let successCount = 0;

		for (let target of targets) {
			let success = await publishItem(client, target);

			if (success) successCount++;
		}

		if (successCount === 0) {
			console.log('Nothing published successfully. Epic fail :(');
		} else {
			console.log(`Publish completed. ${successCount} of ${targets.length} items published successfully.`);
		}
	} else {
		console.warn('Authentication failed. Publish stopped.');
	}
}

module.exports = publish;
