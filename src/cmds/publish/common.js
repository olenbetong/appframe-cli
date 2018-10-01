const { getItem } = require('../../appframe');

async function getItemIfExists(options) {
    const {
        articleId,
        dataObjectId,
        filter,
        hostname,
    } = options;

    try {
        const record = await getItem({
            articleId,
            dataObjectId,
            filter,
            hostname,
        });

        if (record.length === 0) {
            return false;
        }

        return record;
    } catch (ex) {
        console.error(ex);
        return false;
    }
}

module.exports = {
    getItemIfExists
}
