"use strict";

var
	path = require('path');

/**
 * Configuration file for ua-parser-tools
 */
var config = {
	source: "https://raw.github.com/commenthol/ua-parser2-rules/master",
	input: {
		useragents: path.join( __dirname, 'useragents.txt'),
	},
	output: {
		dir: path.join( __dirname, 'report')
	},
	rules: {
		dir    : path.join( __dirname, 'ua-parser2-rules'),
		regexes: 'regexes.yaml',
		models : 'models.yaml',
		tests  : path.join( 'test_resources', 'tests.json'),
		params : [ 'ua', 'engine', 'os', 'device' ]
	}
};

// options for ua-parser2
config.parser = {
	regexes: path.join(config.rules.dir, config.rules.regexes),
	models : path.join(config.rules.dir, config.rules.models)
};

module.exports = config;
