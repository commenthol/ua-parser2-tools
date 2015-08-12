#!/usr/bin/env node

/*!
 * Add new test cases from a txt file containing User-Agent strings to
 * a json based test cases file.
 *
 * If no testcases file is given, the default in "test_resources/tests.json"
 * is choosen for appending the test cases.
 */

'use strict';

var
	fs        = require('fs'),
	path      = require('path'),
	cmd       = require('commander'),
	splitLine = require('streamss').SplitLine,
	readArray = require('streamss').ReadArray,
	through   = require('streamss').Through,
	pick      = require('../lib/compact').pick,
	conf      = require('../config'),
	parser    = require('ua-parser2')(conf.parser);

var
	pwd = process.cwd(),
	config = {
		params   : [ 'ua', 'engine', 'os', 'device' ],          /// params to print on console
		testsFile: path.join(conf.rules.dir, conf.rules.tests), /// default tests file
	};


var M = {
	/*
	 * parse a single user-agent and write the result to the stream
	 */
	parse: function (txt, encoding, done) {
		var
			out = [],
			res;

		res = pick(parser.parse(txt.toString()));

		if (cmd.console){
			out.push('== ' + res.string);
			config.params.forEach(function(p){
				out.push(p + ': ' + JSON.stringify(res[p]));
			});
			console.log(out.join('\n') + '\n');
		}

		config.params.forEach(function(p){
			if (res[p] && res[p].debug) { delete(res[p].debug); }
		});
		this.push(JSON.stringify(res) + '\n'); // jshint ignore:line

		done();
	},

	add: function (userAgent){
		readArray([ userAgent ])
		.pipe(through(M.parse))
		.pipe(fs.createWriteStream(config.testsFile, { flags: 'a', encoding: 'utf8'}));
	},
};

module.exports = M;

function main() {
	/// the program
	cmd
		.option('-u, --useragents <file>', 'Add User-Agents from <file>')
		.option('-t, --tests <file>', 'to tests file <file>')
		.option('-c, --console', 'output details to console')
		.parse(process.argv);

	if (cmd.tests) {
		config.testsFile = path.resolve(pwd, cmd.tests);
	}
	else {
		console.log('\n'+
			'    appending tests to "' + path.relative(pwd, config.testsFile) + '"' +
			'\n');
	}

	if (! cmd.useragents || /^-/.test(cmd.useragents)) {
		console.error('\n'+
			'    specify user-agents file with "-u <file>".\n' +
			'    exiting...'+
			'\n');
		return;
	}

	config.uaFile = path.resolve(pwd, cmd.useragents);

	/*
	 * the pipe - appending new parse results to the tests output
	 */
	fs.createReadStream(config.uaFile, { encoding: 'utf8' })
		.pipe(splitLine({chomp: true}))
		.pipe(through(M.parse))
		.pipe(fs.createWriteStream(config.testsFile, { flags: 'a', encoding: 'utf8'}));
}

if (require.main === module) {
	main();
}