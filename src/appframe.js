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
		hostname,
		articleId,
		dataObjectId,
		item
	} = options;

	const url = `https://${hostname}/create/${articleId}/${dataObjectId}`;
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

async function getItem(options) {
	const {
		hostname,
		articleId,
		dataObjectId,
		filter
	} = options;

	const url = `https://${hostname}/retrieve/${articleId}/${dataObjectId}`;

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

async function putData(options) {
	const {
		hostname,
		articleId,
		data,
		dataObjectId,
		fieldName,
		primKey
	} = options;

	const url = `https://${hostname}/update/${articleId}/${dataObjectId}`;
	const body = JSON.stringify({
		[fieldName]: data,
		PrimKey: primKey
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
		const errorMessage = getErrorFromBody(ex.error);
		console.error(errorMessage);
		return false;
	}
}

async function login(hostname, username, password) {
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
		url: `https://${hostname}/login`,
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
	getItem,
	login,
	putData
}
