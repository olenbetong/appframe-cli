const dotenv = require('dotenv');
const {
	AppframeDataClient
} = require('./appframe');

dotenv.load();

const {
	APPFRAME_LOGIN: username,
	APPFRAME_PWD: password,
	APPFRAME_HOSTNAME: hostname
} = process.env;

describe('AppframeDataClient', () => {
	const client = new AppframeDataClient({ hostname, username, password });

	beforeEach(() => {
		client.logout();
	});

	test('failed login returns success false', async () => {
		let outputData = '';
		const storeLog = inputs => (outputData += inputs);
		
		console['warn'] = jest.fn(storeLog);
		const client = new AppframeDataClient({ hostname, username: 'asdfjkl', password: 'asdfjkl' });
		const auth = await client.login();
	
		expect(auth).toBeTruthy();
		expect(auth).toHaveProperty('success');
		expect(auth.success).toBe(false);
	});
	
	test('can create, get, update and delete records', async () => {
		await client.login();
	
		const commonOptions = {
			articleId: 'components',
			dataObjectId: 'dsComponents',
			domain: hostname
		};
	
		const existing = await client.getData({
			...commonOptions,
			filter: '[Path] = \'jest-test-appframe.js\''
		});
	
		if (existing && existing.length > 0) {
			await client.deleteItem({
				...commonOptions,
				primKey: existing[0][3]
			});
		}
	
		const result = await client.createItem({
			...commonOptions,
			item: {
				Path: 'jest-test-appframe.js'
			}
		});
	
		expect(result).toBeTruthy();
		expect(result).toBeInstanceOf(Array);
	
		const primKey = result[3];
	
		const records = await client.getData({
			...commonOptions,
			filter: `[PrimKey] = '${primKey}'`
		});
	
		expect(records).toBeTruthy();
		expect(records[0][3]).toEqual(primKey);
	
		const updated = await client.updateItem({
			...commonOptions,
			fieldName: 'Path',
			data: 'jest-test-appframe-updated.js',
			primKey
		});
	
		expect(updated).toBeTruthy();
		expect(updated[1]).toEqual('jest-test-appframe-updated.js');
	
		const isDeleted = await client.deleteItem({
			...commonOptions,
			primKey
		});
	
		expect(isDeleted).toBe(true);
	
		const noData = await client.getData({
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
	
		const tables = await client.executeProcedure({
			...commonOptions,
			procedure: 'procFieldAdd'
		});
	
		expect(tables.length).toBe(1);
		expect(tables[0].length).toBe(1);
		expect(tables[0][0].FieldName).toBe('Created');
	
		const noData = await client.executeProcedure({
			...commonOptions,
			procedure: 'procFieldRemove'
		});
	
		expect(noData.length).toBe(0);
	});

	test('get hostname for alias', async () => {
		const hostname = await client.getHostNameFromAlias('test.synergi.olenbetong.no');
		expect(hostname).toBe('synergi.olenbetong.no');
	});

});
