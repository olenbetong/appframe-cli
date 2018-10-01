const { getItemIfExists } = require('./common.js');

async function publishToGlobalComponent(config) {
    const { hostname, target } = config;
    const getItemOptions = {
        articleId: 'components',
        dataObjectId: 'dsComponents',
        filter: `[Path] = '${target}'`,
        hostname
    };

    const record = await getItemIfExists(getItemOptions);

    if (!record) {
        console.log(`Target '${target}' doesn't exist. Creating...`);
    } else {
        console.log(`Target '${target}' found with primkey '${record.PrimKey}`);
    }
}

async function publishToSiteComponent(config) {

}

module.exports = {
    publishToGlobalComponent,
    publishToSiteComponent
}
