"use strict";

var
	path = require('path');

/**
 * Configuration file for ua-parser-tools
 */
var config = {
  source: "https://raw.github.com/commenthol/ua-parser2/master",
  input: {
    useragents: path.join( __dirname, 'useragents.txt'),
  },
  output: {
    dir: path.join( __dirname, 'report')
  },
  uaParser2: {
    dir: path.join( __dirname, 'ua-parser2'),
    regexes: 'regexes.yaml',
    tests: path.join( 'test_resources', 'tests.json'),
    params: [ 'ua', 'engine', 'os', 'device' ]
  }
};

module.exports = config;
