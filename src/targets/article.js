
const { AppframeDataclient } = require('../appframe');

class AppframeArticleClient extends AppframeDataclient {

	async getArticleScript(options) {
		const { domain } = options;

		const record = await this.getItemIfExists({
			articleId: 'appdesigner-script',
			domain,
			dataObjectId: 'dsScripts',
			filter: `[HostName] = '${options.hostname}' AND [ArticleID] = '${options.articleId}' AND [ID] = '${options.id}`,
			hostname: options.hostname
		});

		if (!record) {
			return false;
		}

		const [hostname, articleId, id, script, exclude, primKey] = record;

		return {
			articleId,
			exclude,
			hostname,
			id,
			primKey,
			script,
		};
	}

	async getArticleStyle(options) {
		const { domain } = options;

		const record = await this.getItemIfExists({
			articleId: 'appdesigner-css',
			domain,
			dataObjectId: 'dsArticle',
			filter: `[HostName] = '${options.hostname}' AND [ArticleID] = '${options.articleId}'`,
			hostname: options.hostname
		});

		if (!record) {
			return false;
		}

		const [hostname, articleId, checkedOutBy, content, primKey] = record;

		return {
			articleId,
			checkedOutBy,
			content,
			hostname,
			primKey,
		};
	}
}

module.exports = {
	AppframeArticleClient
};
