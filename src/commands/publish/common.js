const { createItem, getData, updateItem } = require('../../appframe');
const fs = require('fs');

async function getItemIfExists(options) {
	const {
		articleId,
		dataObjectId,
		domain,
		filter,
	} = options;

	try {
		const record = await getData({
			articleId,
			dataObjectId,
			domain,
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

function getSourceData(file) {
	return new Promise((res, reject) => {
		try {
			const cwd = process.cwd();
			const path = require.resolve(file, { paths: [cwd] });
	
			if (!path) {
				reject(new Error(`Failed to resolve source file '${file}'.`));
	
				return;
			}
	
			fs.readFile(path, 'utf8', (err, data) => {
				if (err) {
					reject(new Error(err));
				} else {
					res(data);
				}
			})
		} catch (error) {
			reject(error);
		}
	});
}

async function publishItemToDataObject(config) {
	const {
		createArticleId,
		createDataObjectId,
		domain,
		fieldName,
		filter,
		item,
		primKeyIndex,
		sourceData,
		target,
		type,
		updateArticleId,
		updateDataObjectId,
	} = config;

	const commonOptions = {
		articleId: createArticleId,
		dataObjectId: createDataObjectId,
		domain
	};

	const getItemOptions = {
		...commonOptions,
		filter
	};

	try {
		let record = await getItemIfExists(getItemOptions);

		if (!record) {
			console.log(`Creating '${target}'...`);
			const createOptions = {
				...commonOptions,
				item
			};

			record = await createItem(createOptions);

			if (!record) {
				throw new Error('Failed to create new record.');
			}
		} else {
			console.log(`Updating '${target}'...`);
		}

		const primKey = record[primKeyIndex];
		const putDataOptions = {
			...commonOptions,
			articleId: updateArticleId,
			dataObjectId: updateDataObjectId,
			data: sourceData,
			fieldName,
			primKey
		};

		const status = await updateItem(putDataOptions);

		return status ? true : false;
	} catch (ex) {
		console.error(`Failed to publish to ${type}: ${ex.message}`);

		return false;
	}
}

module.exports = {
	getItemIfExists,
	getSourceData,
	publishItemToDataObject
}
