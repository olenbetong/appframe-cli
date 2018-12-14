const { AppframeDataClient } = require('../../appframe');

class InstallClient extends AppframeDataClient {
	async installLocalComponent(hostname) {
		const articleId = 'components';
		const dataObjectId = 'dsSiteComponents';
		const filter = `[HostName] = '${hostname}' AND [ArticleId] = '${articleId}' AND [ID] = '${dataObjectId}'`;
		const options = {
			articleId: 'appdesigner',
			dataObjectId: 'dsDataSources',
		};

		try {
			let record = await this.getData({
				...options,
				filter
			});

			if (record.length === 0) {
				console.log(`Creating ${dataObjectId}...`);

				record = await this.createItem({
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

			await this.updateItem({
				articleId: 'appdesigner-datasource',
				dataObjectId: 'dsDataSource',
				data: {
					AllowDelete: true,
					AllowInsert: true,
					AllowUpdate: true
				},
				primKey
			});

			const fields = ['PrimKey', 'Content', 'ContentTest', 'HostName', 'Path'];

			for (let field of fields) {
				console.log(`Adding field '${field}'...`);

				await this.executeProcedure({
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

			await this.executeProcedure({
				articleId: 'appdesigner',
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
}

module.exports = {
	InstallClient
}
