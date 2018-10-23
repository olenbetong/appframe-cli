const { version } = require('../../package.json');

module.exports = function() {
	console.log(`v${version}`);
}
