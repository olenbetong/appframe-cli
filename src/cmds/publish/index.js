const { resolve } = require('path');
const { login } = require('../../appframe');

const types = [
    'article-script',
    'article-style',
    'component-global',
    'component-site',
    'site-script',
    'site-style'
];

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

function publishToGlobalComponent(config) {

}

function publishToSiteComponent(config) {
    
}

function publishToSiteScript(config) {

}

function validateConfiguration(config) {

}

function publishItem(item) {
    if (typeof item === 'array') {
        const [source, type, target] = item;
        publishItem({ source, type, target });
    } else {
        if (item.type === 'article-script') {
            publishToArticle(config);
        } else if (item.type === 'article-style') {

        } else if (item.type === 'component-global') {
            publishToGlobalComponent(config);
        } else if (item.type === 'component-site') {

        } else if (item.type === 'site-script') {
            publishToSiteScript(config);
        } else if (item.type === 'site-style') {

        }
    }
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
        
        if (config.target instanceof Array && config.target[0] instanceof Array) {
            for (let item of config.target) {
                publishItem(item);
            }
        } else {
            publishItem(config.target);
        }

        console.log('publishing', config);
    }
}

module.exports = publish;
