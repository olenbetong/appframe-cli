const { getItemIfExists, getSourceData } = require('./common.js');
const { putData } = require('../../appframe');

async function publishToGlobalComponent(config) {
    const { hostname, source, target } = config;
    const commonOptions = {
        hostname
    };
    
    const getItemOptions = {
        ...commonOptions,
        articleId: 'components',
        dataObjectId: 'dsComponents',
        filter: `[Path] = '${target}'`
    };

    const record = await getItemIfExists(getItemOptions);

    try {
        if (!record) {
            console.log(`Target '${target}' doesn't exist. Creating...`);
        } else {
            const [,,,primKey] = record;
            console.log(`Target '${target}' found with primkey '${primKey}'`);
    
            const sourceData = await getSourceData(source);
            const putDataOptions = {
                ...commonOptions,
                articleId: 'components-editor',
                data: sourceData,
                dataObjectId: 'dsComponent',
                fieldName: 'ContentTest',
                primKey
            };

            const status = await putData(putDataOptions);

            return status ? true : false;
        }
    } catch (err) {
        console.error(`Failed to publish to global component: ${err.message}`);
    }
}

async function publishToSiteComponent(config) {

}

module.exports = {
    publishToGlobalComponent,
    publishToSiteComponent
}
