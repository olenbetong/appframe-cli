const { getItemIfExists, getSourceData } = require('./common.js');
const { createItem, putData } = require('../../appframe');

async function publishToGlobalComponent(config) {
	const { hostname, source, target } = config;
	const commonOptions = {
		articleId: 'components',
		dataObjectId: 'dsComponents',
		hostname
	};
	
	const getItemOptions = {
		...commonOptions,
		filter: `[Path] = '${target}'`
	};

	let record = await getItemIfExists(getItemOptions);

	try {
		if (!record) {
			console.log(`Creating '${target}'...`);
			const createOptions = {
				...commonOptions,
				item: {
					Path: target
				}
			}
			record = await createItem(createOptions);

			if (!record) {
				throw new Error('Failed to create new record.');
			}
		} else {
			console.log(`Updating '${target}...`);
		}

		const [,,,primKey] = record;
		const sourceData = await getSourceData(source);
		const putDataOptions = {
			...commonOptions,
			articleId: 'components-editor',
			data: sourceData,
			dataObjectId: 'dsComponent',
			fieldName: 'ContentTest',
			primKey
		};

		const status = await putData(putDataOptions);

		return status ? true : false;
	} catch (err) {
		console.error(`Failed to publish to global component: ${err.message}`);

		return false;
	}
}

async function publishToSiteComponent(config) {

}

module.exports = {
	publishToGlobalComponent,
	publishToSiteComponent
}
