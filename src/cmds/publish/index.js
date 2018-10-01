const { resolve } = require('path');
const { login } = require('../../appframe');
const { publishToGlobalComponent, publishToSiteComponent } = require('./component');

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

async function publishToArticleScript(config) {

}

async function publishToArticleStyle(config) {

}

async function publishToSiteScript(config) {

}

async function publishToSiteStyle(config) {

}

function validateConfiguration(config) {

}

async function publishItem(item) {
    const { hostname, source, type, target } = item;

    console.log(`Publishing file '${item.source}' to ${type} '${target}' in ${item.hostname}...`);

    if (item.type === 'article-script') {
        return await publishToArticleScript(item);
    } else if (item.type === 'article-style') {
        return await publishToArticleStyle(item);
    } else if (item.type === 'component-global') {
        return await publishToGlobalComponent(item);
    } else if (item.type === 'component-site') {
        return await publishToSiteComponent(item);
    } else if (item.type === 'site-script') {
        return await publishToSiteScript(item);
    } else if (item.type === 'site-style') {
        return await publishToSiteStylke(item);
    } else {
        console.error(`Type '${type}' is not supported.`);

        return false;
    }
}

async function publishItemFromArray(array, fallbackHostname) {
    const [source, target, type, hostname] = array;
    const item = {
        hostname,
        source,
        target,
        type
    };

    if (!item.hostname) {
        item.hostname = fallbackHostname;
    }

    return await publishItem(item);
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
        
        const { target, source, type } = config;
        if (target && source && type) {
            publishItem({ source, target, type })
        }

        if (config.files instanceof Array && config.files.length > 0) {

            if (config.files[0] instanceof Array || typeof config.files[0] === 'object') {
                // config is array of publish items
                const { hostname } = config;

                for (let item of config.files) {
                    if (item instanceof Array) {
                        await publishItemFromArray(item, hostname);
                    } else {
                        await publishItem({ hostname, ...item });
                    }
                }
            } else {
                // config is a single publish item
                publishItem(item);
            }

        } else if (typeof config.files === 'object') {
            publishItem(config.files);
        }
    }
}

module.exports = publish;
