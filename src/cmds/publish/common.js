const { getItem } = require('../../appframe');
const fs = require('fs');

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

        return record[0];
    } catch (ex) {
        console.error(ex);
        return false;
    }
}

function getSourceData(file) {
    return new Promise((res, reject) => {
        try {
            const cwd = process.cwd();
            const path = require.resolve(file, { paths: [cwd] });
    
            if (!path) {
                reject(new Error(`Failed to resolve source file '${file}'.`));
    
                return;
            }
    
            fs.readFile(path, 'utf8', (err, data) => {
                if (err) {
                    reject(new Error(err));
                } else {
                    res(data);
                }
            })
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    getItemIfExists,
    getSourceData
}
