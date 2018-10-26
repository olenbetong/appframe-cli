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

}

module.exports = {
	publishToGlobalComponent,
	publishToSiteComponent
}
