const { getItemIfExists, getSourceData } = require('./common.js');
const { createItem, putData } = require('../../appframe');

async function publishToSiteStyle(config) {
	return await publishToSiteItem({
		...config,
		fieldName: 'StyleContentTest',
		createDataObjectId: 'dsStyles',
		updateArticleId: 'sitesetup-stylesheet',
		updateDataObjectId: 'dsStylesheet'
	});
}

async function publishToSiteScript(config) {
	return await publishToSiteItem({
		...config,
		fieldName: 'ScriptContentTest',
		createDataObjectId: 'dsScripts',
		updateArticleId: 'sitesetup-script',
		updateDataObjectId: 'dsScript'
	});
}

async function publishToSiteItem(config, dataObjectId, updateArticle) {
	const {
		fieldName,
		createDataObjectId,
		hostname,
		source,
		target,
		type,
		updateArticleId,
		updateDataObjectId
	} = config;

	const commonOptions = {
		articleId: 'sitesetup',
		dataObjectId: createDataObjectId,
		hostname
	};

	const getItemOptions = {
		...commonOptions,
		filter: `[Name] = '${target}'`
	};

	try {
		let record = await getItemIfExists(getItemOptions);

		if (!record) {
			console.log(`Creating '${target}'...`);
			const createOptions = {
				...commonOptions,
				item: {
					HostName: hostname,
					Name: target
				}
			};

			record = await createItem(createOptions);

			if (!record) {
				throw new Error('Failed to create new record.');
			}
		} else {
			console.log(`Updating '${target}'...`);
		}

		const primKey = record[4];
		const sourceData = await getSourceData(source);
		const putDataOptions = {
			...commonOptions,
			articleId: updateArticleId,
			dataObjectId: updateDataObjectId,
			data: sourceData,
			fieldName,
			primKey
		};

		const status = await putData(putDataOptions);

		return status ? true : false;
	} catch (ex) {
		console.error(`Failed to publish to ${type}: ${ex.message}`);

		return false;
	}
}

module.exports = {
	publishToSiteScript,
	publishToSiteStyle
}
