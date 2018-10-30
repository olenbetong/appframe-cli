const rp = require('request-promise-native');
const querystring = require('querystring');
const cheerio = require('cheerio');
const jar = rp.jar();

const loginFailedStr = 'Login failed. Please check your credentials.';

const commonOptions = {
	jar,
	method: 'POST',
	resolveWithFullResponse: true
};

const commonHeaders = {
	'Content-Type': 'application/json; charset=utf-8',
	'X-Requested-With': 'XMLHttpRequest'
};

async function createItem(options) {
	const {
		articleId,
		dataObjectId,
		domain,
		item
	} = options;

	const url = `https://${domain}/create/${articleId}/${dataObjectId}`;
	const body = JSON.stringify(item);

	const reqOptions = {
		...commonOptions,
		body,
		headers: {
			...commonHeaders,
			'Content-Length': body.length
		},
		url
	};

	return await request(reqOptions);
}

async function getData(options) {
	const {
		domain,
		articleId,
		dataObjectId,
		filter
	} = options;

	const url = `https://${domain}/retrieve/${articleId}/${dataObjectId}`;

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
		...commonOptions,
		body,
		headers: {
			...commonHeaders,
			'Content-Length': body.length
		},
		url
	};

	return await request(reqOptions);
}

async function updateItem(options) {
	const {
		domain,
		articleId,
		data,
		dataObjectId,
		fieldName,
		primKey
	} = options;

	const url = `https://${domain}/update/${articleId}/${dataObjectId}`;
	const body = typeof data === 'object'
		? JSON.stringify({ ...data, PrimKey: primKey })
		: JSON.stringify({ [fieldName]: data, PrimKey: primKey });

	const reqOptions = {
		...commonOptions,
		body,
		headers: {
			...commonHeaders
		},
		url
	};

	return await request(reqOptions);
}

async function deleteItem(options) {
	const {
		domain,
		articleId,
		dataObjectId,
		primKey
	} = options;

	const url = `https://${domain}/destroy/${articleId}/${dataObjectId}`;
	const body = JSON.stringify({
		PrimKey: primKey
	});

	const reqOptions = {
		...commonOptions,
		body,
		headers: {
			...commonHeaders
		},
		url
	}

	return await request(reqOptions);
}

async function executeProcedure(options) {
	const {
		domain,
		articleId,
		procedure,
		params
	} = options;

	const url = `https://${domain}/exec/${articleId}/${procedure}`;
	const body = JSON.stringify(params);

	const reqOptions = {
		...commonOptions,
		body,
		headers: {
			...commonHeaders
		},
		url
	};

	return await request(reqOptions);
}

async function request(options) {
	try {
		const res = await rp(options);
		const data = JSON.parse(res.body);

		if (data.success) {
			return data.success;
		} else if (data.error) {
			console.error(`Request failed: ${data.error}`);
		}

		return false;
	} catch (ex) {
		const errorMessage = ex.message.indexOf('DOCTYPE') >= 0 ? getErrorFromBody(ex.error) : ex.error;
		console.error(errorMessage);
		return false;
	}
}

async function login(domain, username, password) {
	const data = {
		password,
		remember: false,
		username
	};

	const body = querystring.stringify(data);

	const reqOptions = {
		body,
		headers: {
			'Content-Length': body.length,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		jar,
		method: 'POST',
		resolveWithFullResponse: true,
		url: `https://${domain}/login`,
	};

	try {
		console.log('Authenticating...');

		const res = await rp(reqOptions);

		if (res.statusCode === 200 && !res.body.includes(loginFailedStr)) {
			console.log('Authentication successful.');

			return true;
		} else if (res.body.includes(loginFailedStr)) {
			console.warn(loginFailedStr);
		} else {
			console.warn(`Login failed (${res.statusCode})`);
		}

		return false;
	} catch (err) {
		console.error(err);
		return false;
	}
}

function getErrorFromBody(body) {
	const $ = cheerio.load(body);

	return $('#details pre').text();
}

module.exports = {
	createItem,
	deleteItem,
	executeProcedure,
	getData,
	login,
	updateItem
}
