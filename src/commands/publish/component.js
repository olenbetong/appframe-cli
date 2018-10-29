const { publishItemToDataObject } = require('./common.js');

async function publishToGlobalComponent(config) {
	const { mode, target } = config;

	return await publishItemToDataObject({
		...config,
		createArticleId: 'components',
		createDataObjectId: 'dsComponents',
		fieldName: mode.toLowerCase() === 'production' ? 'Content' : 'ContentTest',
		filter: `[Path] = '${target}'`,
		item: {
			Path: target
		},
		primKeyIndex: 3,
		updateArticleId: 'components-editor',
		updateDataObjectId: 'dsComponent'
	});
}

async function publishToSiteComponent(config) {
	const { hostname, mode, target } = config;

	return await publishItemToDataObject({
		...config,
		createArticleId: 'components',
		createDataObjectId: 'dsSiteComponents',
		fieldName: mode.toLowerCase() === 'production' ? 'Content' : 'ContentTest',
		filter: `[HostName] = '${hostname}' AND [Path] = '${target}'`,
		item: {
			HostName: hostname,
			Path: target
		},
		primKeyIndex: 0,
		updateArticleId: 'components',
		updateDataObjectId: 'dsSiteComponents'
	});
}

module.exports = {
	publishToGlobalComponent,
	publishToSiteComponent
}
