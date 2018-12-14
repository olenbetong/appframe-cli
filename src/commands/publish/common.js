const fs = require('fs');

function getSourceData(file) {
	if (!file) {
		return Promise.resolve(false);
	}

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
	getSourceData,
}
