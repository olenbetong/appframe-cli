const { createItem, executeProcedure, getItem, putData } = require('../../appframe');

async function installLocalComponent(hostname) {
	const articleId = 'components';
	const dataObjectId = 'dsSiteComponents';
	const filter = `[HostName] = '${hostname}' AND [ArticleId] = '${articleId}' AND [ID] = '${dataObjectId}'`;
	const options = {
		articleId: 'appdesigner',
		dataObjectId: 'dsDataSources',
		domain: hostname,
		
	};

	try {
		let record = await getItem({
			...options,
			filter
		});

		if (record.length === 0) {
			console.log(`Creating ${dataObjectId}...`);

			record = await createItem({
				...options,
				item: {
					ArticleId: articleId,
					ID: dataObjectId,
					HostName: hostname,
					ViewName: 'stbv_WebSiteCMS_Components'
				}
			})
		} else {
			record = record[0];
		}

		const primKey = record[4];

		console.log('Setting data source permissions...');

		await putData({
			articleId: 'appdesigner-datasource',
			dataObjectId: 'dsDataSource',
			data: {
				AllowDelete: true,
				AllowInsert: true,
				AllowUpdate: true
			},
			domain: hostname,
			primKey
		});

		const addFieldOptions = {
			articleId: 'appdesigner-datasource',
			domain: hostname,
			procedure: 'procFieldAdd',
		};

		const fields = ['PrimKey', 'Content', 'ContentTest', 'HostName', 'Path'];

		for (let field of fields) {
			console.log(`Adding field '${field}'...`);

			await executeProcedure({
				articleId: 'appdesigner-datasource',
				domain: hostname,
				procedure: 'procFieldAdd',
				params: {
					ArticleId: articleId,
					DataSourceID: dataObjectId,
					FieldName: field,
					HostName: hostname
				}
			});
		}

		console.log(`Publishing changes...`);

		await executeProcedure({
			articleId: 'appdesigner',
			domain: hostname,
			procedure: 'procPublish',
			params: {
				Description: '[appframe-cli] Added site component data source',
				FromArticle: 'components',
				FromHostName: hostname,
				toArticle: 'components'
			}
		});

		console.log('Done!');
	} catch (ex) {
		console.error(ex);
	}
}

module.exports = {
	installLocalComponent
}
