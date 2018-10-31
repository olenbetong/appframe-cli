const dotenv = require('dotenv');
const {
	createItem,
	deleteItem,
	executeProcedure,
	getData,
	login,
	updateItem
} = require('./appframe');

dotenv.load();

const {
  APPFRAME_LOGIN: user,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname
} = process.env;

test('can create, get, update and delete records', async () => {
	await login(hostname, user, password);

	const commonOptions = {
		articleId: 'components',
		dataObjectId: 'dsComponents',
		domain: hostname
	};

	const existing = await getData({
		...commonOptions,
		filter: `[Path] = 'jest-test-appframe.js'` 
	});

	if (existing.length > 0) {
		await deleteItem({
			...commonOptions,
			primKey: existing[0][3]
		});
	}

	const result = await createItem({
		...commonOptions,
		item: {
			Path: 'jest-test-appframe.js'
		}
	});

	expect(result).toBeTruthy();

	const primKey = result[3];

	const records = await getData({
		...commonOptions,
		filter: `[PrimKey] = '${primKey}'`
	});

	expect(records).toBeTruthy();
	expect(records[0][3]).toEqual(primKey);

	const updated = await updateItem({
		...commonOptions,
		fieldName: 'Path',
		data: 'jest-test-appframe-updated.js',
		primKey
	});

	expect(updated).toBeTruthy();
	expect(updated[1]).toEqual('jest-test-appframe-updated.js');

	const isDeleted = await deleteItem({
		...commonOptions,
		primKey
	});

	expect(isDeleted).toBe(true);

	const noData = await getData({
		...commonOptions,
		filter: `[PrimKey] = '${primKey}'`
	});

	expect(noData.length).toBe(0);
});

test('can execute stored procedures', async () => {
	const commonOptions = {
		articleId: 'appdesigner-datasource',
		domain: hostname,
		params: {
			ArticleId: 'components',
			DataSourceID: 'dsSiteComponents',
			FieldName: 'Created',
			HostName: hostname
		}
	};

	const tables = await executeProcedure({
		...commonOptions,
		procedure: 'procFieldAdd'
	});

	expect(tables.length).toBe(1);
	expect(tables[0].length).toBe(1);
	expect(tables[0][0].FieldName).toBe('Created');

	const noData = await executeProcedure({
		...commonOptions,
		procedure: 'procFieldRemove'
	});

	expect(noData.length).toBe(0);
});
