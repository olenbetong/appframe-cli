const { resolve } = require('path');
const { login } = require('../../appframe');

const types = ['article', 'component', 'site'];

function getConfigFromArgs(args) {
    const config = {};
    const potentialArgs = [
        'article',
        'database',
        'hostname',
        'password',
        'production',
        'server',
        'source',
        'target',
        'user',
    ];

    for (let arg of potentialArgs) {
        if (args[arg]) {
            config[arg] = args[arg];
        }
    }

    if (args.production === true || args.p === true) {
        config.production = true;
    }

    if (typeof args.type === 'string') {
        if (!types.includes(args.type.toLowerCase())) {
            throw new Error(`'${args.type}' is not a valid type.`);
        } else {
            config.type = args.type.toLowerCase();
        }
    }

    return config;
}

function publishToArticle(config) {

}

function publishToComponent(config) {

}

function publishToSiteScript(config) {

}

function validateConfiguration(config) {

}

async function publish(args) {
    const configFromFile = args.config ? require(resolve(args.config)) : {};
    const config = Object.assign(
        {
            production: false,
            type: 'component'
        },
        configFromFile,
        getConfigFromArgs(args)
    );

    if (await login(config.hostname, config.user, config.password)) {
        validateConfiguration(config);
        
        console.log('publishing', config);

        if (config.type === 'article') {
            publishToArticle(config);
        } else if (config.type === 'component') {
            publishToComponent(config);
        } else if (config.type === 'site') {
            publishToSiteScript(config);
        }
        
    }
}

module.exports = publish;
