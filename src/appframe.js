const rp = require('request-promise-native');
const querystring = require('querystring');
const jar = rp.jar();

const loginFailedStr = 'Login failed. Please check your credentials.';

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
    login
}
