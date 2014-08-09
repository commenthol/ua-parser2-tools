'use strict';

var
	path = require('path'),
	config = require('../config');

/*
 * load ua-parser2
 */
var
	parser,
	loc = path.join(config.uaParser2.dir, 'js', 'index.js');

try {
	parser = require(loc);
}
catch (e) {
	console.error(
		'\n' +
		'    Download `ua-parser2` and install in this directory.\n' +
		'    Exiting...\n' +
		'\n');
		process.exit();
}

module.exports = parser;
