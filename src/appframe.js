const rp = require('request-promise-native');
const querystring = require('querystring');
const jar = rp.jar();

const loginFailedStr = 'Login failed. Please check your credentials.';

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
        body,
        headers: {
            'Content-Length': body.length,
            'Content-Type': 'application/json; charset=utf-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        jar,
        method: 'POST',
        resolveWithFullResponse: true,
        url
    };

    try {
        console.log('Checking if item exists in database...');

        const res = await rp(reqOptions);
        const data = JSON.parse(res.body);

        if (data.success) {
            return data.success;
        } else {
            console.error(`Failed to retrieve item ${data.error}`);
            return false;
        }
    } catch (ex) {
        console.error(ex);

        return false;
    }
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
        body,
        headers: {
            'Content-Length': body.length,
            'Content-Type': 'application/json; charset=utf-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        jar,
        method: 'POST',
        resolveWithFullResponse: true,
        url
    };

    try {
        console.log(`Updating record '${primKey}' in '${articleId}/${dataObjectId}...`);
        const res = await rp(reqOptions);
        const resultData = JSON.parse(res.body);

        if (resultData.success) {
            console.log('Record updated successfully.');
            return resultData.success;
        }

        console.error(`Failed to update record: ${resultData.error}`);

        return false;
    } catch (ex) {
        console.error(ex);

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

module.exports = {
    getItem,
    login,
    putData
}
