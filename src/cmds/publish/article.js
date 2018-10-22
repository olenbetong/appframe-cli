const { publishItemToDataObject } = require('./common.js');

async function publishToArticleScript(config) {
	const { hostname, target, targetArticleId } = config;

	return await publishItemToDataObject({
		...config,
		createArticleId: 'appdesigner',
		createDataObjectId: 'dsScripts',
		fieldName: 'Script',
		filter: `[HostName] = '${hostname}' AND [ArticleID] = '${targetArticleId}' AND [ID] = '${target}'`,
		item: {
			ArticleID: targetArticleId,
			ID: target,
			HostName: hostname,
		},
		primKeyIndex: 4,
		updateArticleId: 'appdesigner-script',
		updateDataObjectId: 'dsScripts'
	});
}

async function publishToArticleStyle(config) {
	const { hostname, targetArticleId } = config;
}

module.exports = {
	publishToArticleScript
}
