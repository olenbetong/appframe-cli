const { publishItemToDataObject } = require('./common.js');

async function publishToSiteStyle(config) {
	const { hostname, mode, target } = config;

	return await publishItemToDataObject({
		...config,
		createArticleId: 'sitesetup',
		createDataObjectId: 'dsStyles',
		fieldName: mode.toLowerCase() === 'production' ? 'StyleContent' : 'StyleContentTest',
		filter: `[HostName] = '${hostname}' AND [Name] = '${target}'`,
		item: {
			Name: target,
			HostName: hostname,
		},
		primKeyIndex: 4,
		updateArticleId: 'sitesetup-stylesheet',
		updateDataObjectId: 'dsStylesheet'
	});
}

async function publishToSiteScript(config) {
	const { hostname, target } = config;

	return await publishItemToDataObject({
		...config,
		createArticleId: 'sitesetup',
		createDataObjectId: 'dsScripts',
		fieldName: mode.toLowerCase() === 'production' ? 'ScriptContent' : 'ScriptContentTest',
		filter: `[HostName] = '${hostname}' AND [Name] = '${target}'`,
		item: {
			Name: target,
			HostName: hostname,
		},
		primKeyIndex: 4,
		updateArticleId: 'sitesetup-script',
		updateDataObjectId: 'dsScript'
	});
}

module.exports = {
	publishToSiteScript,
	publishToSiteStyle
}
