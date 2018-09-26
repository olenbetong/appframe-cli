const { resolve } = require('path');

const types = ['article', 'component', 'script']

function getConfigFromArgs(args) {
    const config = {};

    config.article = args.article || null;
    config.database = args.database || null;
    config.hostname = args.hostname || null;
    config.password = args.password || null;
    config.production = args.production === true || args.p === true || false;
    config.server = args.server || null;
    config.source = args.source || null;
    config.target = args.target || null;
    config.type = typeof args.type === 'string' && types.includes(args.type.toLowerCase())
        ? args.type.toLowerCase()
        : 'component';
    config.user = args.user || null;

    return config;
}

function publishToArticle(config) {

}

function publishToComponent(connection, config) {

}

function publishToSiteScript(connection, config) {

}

function validateConfiguration(connection, config) {

}

function publish(args) {
    const configFromFile = args.config ? require(resolve(args.config)) : {};
    const config = Object.assign(
        {},
        configFromFile,
        getConfigFromArgs(args)
    );

    validateConfiguration(config);

    if (config.type === 'article') {
        publishToArticle(config);
    } else if (config.type === 'component') {
        publishToComponent(config);
    } else if (config.type === 'script') {
        publishToSiteScript(config);
    }

    console.log('publishing', config);
}

module.exports = publish;
