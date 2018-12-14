const AppframeClient = require('@olenbetong/appframe-client');

class AppframeDataClient extends AppframeClient {
	async createItem(options) {
		const {
			articleId,
			dataObjectId,
			item
		} = options;
	
		const url = this.getUrl(`create/${articleId}/${dataObjectId}`);
		const body = JSON.stringify(item);
		const reqOptions = {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/json; charset=utf-8',
			},
			url
		};

		return await this.request(reqOptions);
	}

	async getData(options) {
		const {
			articleId,
			dataObjectId,
			filter
		} = options;
	
		const url = this.getUrl(`retrieve/${articleId}/${dataObjectId}`);
	
		const body = JSON.stringify({
			distinctRows: false,
			filterObject: null,
			filterString: '',
			masterChildCriteria: {},
			maxRecords: 100,
			sortOrder: [],
			whereClause: typeof filter === 'string' ? filter : '',
			whereObject: typeof filter === 'object' ? filter : null
		});
	
		const reqOptions = {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/json; charset=utf-8',
			},
			url
		};
	
		const response = await this.request(reqOptions);
	
		if (response.success) {
			return response.success;
		}

		return response;
	}

	async updateItem(options) {
		const {
			articleId,
			data,
			dataObjectId,
			fieldName,
			primKey
		} = options;
	
		const url = this.getUrl(`update/${articleId}/${dataObjectId}`);
		const body = typeof data === 'object'
			? JSON.stringify({ ...data, PrimKey: primKey })
			: JSON.stringify({ [fieldName]: data, PrimKey: primKey });
	
		const reqOptions = {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/json; charset=utf-8',
			},
			url
		};
	
		const response = await this.request(reqOptions);
	
		if (response.success) {
			return response.success;
		}

		return response;
	}

	async deleteItem(options) {
		const {
			articleId,
			dataObjectId,
			primKey
		} = options;
	
		const url = this.getUrl(`destroy/${articleId}/${dataObjectId}`);
		const body = JSON.stringify({
			PrimKey: primKey
		});
	
		const reqOptions = {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/json; charset=utf-8',
			},
			url
		};
	
		const response = await this.request(reqOptions);
	
		if (response.success) {
			return response.success;
		}

		return response;
	}

	async executeProcedure(options) {
		const {
			articleId,
			procedure,
			params
		} = options;
	
		const url = this.getUrl(`exec/${articleId}/${procedure}`);
		const body = JSON.stringify(params);
	
		const reqOptions = {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/json; charset=utf-8',
			},
			url
		};
	
		const response = await this.request(reqOptions);
	
		if (response.success) {
			return response.success;
		}

		return response;
	}

	async getItemIfExists(options) {
		const {
			articleId,
			dataObjectId,
			filter,
		} = options;

		try {
			const record = await this.getData({
				articleId,
				dataObjectId,
				filter
			});

			if (record.length === 0) {
				return false;
			}

			return record[0];
		} catch (ex) {
			console.error(ex);
			return false;
		}
	}
}

module.exports = {
	AppframeDataClient
};
