'use strict';

var	fs = require('fs'),
	path = require('path'),
	assert = require('assert'),
	cli = require('commander'),
	config = require('../config'),
	fileSync = require('./filesync'),
	parser = require('./requireparser'),
	helper = require('./helper.js'),
	JsonStream = require('./jsonstream'),
	MapStream = require('./mapstream'),
	deepEqual = require('./deepequal'),
	ReportType = require('./report').ReportType,
	ReportFailed = require('./report').ReportFailed;

var	M = {};

/**
 * command line interface
 */
cli
	.option('-u, --useragents [file]', 'Read User-Agents from [file]')
	.option('-t, --tests [file]', 'Read tests from [file] (.json, .yaml)')
	.option('-o, --outdir <path>', 'Write all output to <path>')
	.option('-c, --console', 'Output to console')
	.option('-s, --swap', 'swap debug field in .csv output')
	.option('-n, --noappend', 'do not append parsed User-Agents to output tests file');



/*
 * select the correct parsing function
 */
function selectParser(type) {
	var
		parse,
		regexesFile = path.join(config.uaParser2.dir, config.uaParser2.regexes);

	switch (type) {
		case 'ua':
			parse = parser(regexesFile).parseUA;
			break;
		case 'os':
			parse = parser(regexesFile).parseOS;
			break;
		case 'engine':
			parse = parser(regexesFile).parseEngine;
			break;
		case 'device':
			parse = parser(regexesFile).parseDevice;
			break;
		default:
			parse = parser(regexesFile).parse;
			break;
	}
	return parse;
}

/*
 * set the right output file for the tests
 */
function output(type) {
	return config.output.dir + '/' + (type || 'all');
}

/*
 * parse the tests
 */
function parseTests (opts) {
	opts = opts || {};

	var	count = 0,
		agents = {},     // hashmap to check on doubled user-agents 
		useragents = [],
		parse = selectParser(opts.type),
		report = new ReportType(opts.type, cli.swap),
		failed = new ReportFailed(opts.type, cli.swap);

	if (opts.useragents) {
		useragents = fileSync.readUserAgentsListSync(opts.useragents);
	}

	function map (obj, encoding, done) {
		var	i,
			line = '',
			tmpR = {},
			exp = {},
			res = {},
			out = '';

		count += 1;

		tmpR = parse(obj.string);

		// normalize `res` and `exp` to allow comparison
		if (opts.type) {
			res[opts.type] = tmpR;
			if (obj[opts.type]){
				exp[opts.type] = obj[opts.type];
			}
			// copy debug info
			if (tmpR.debug) {
				exp[opts.type].debug = tmpR.debug;
			}
		}
		else {
			res = tmpR;
			// copy debug info
			config.uaParser2.params.forEach(function(p){
				if (res[p] && res[p].debug) {
					obj[p].debug = res[p].debug;
				}
			});
			exp = obj;
		}
		res = helper.compact.strip(res);

		// check for doubled testcases
		if (agents[obj.string]) {
			console.error('    Doubled testcase: ' + obj.string);
			return done();
		}
		agents[obj.string] = 1;

		report.add(obj);

		if (! deepEqual(res, exp)) {
			line = failed.add(res, exp);
			console.error(line);
		}

		res.string = obj.string;
		out = JSON.stringify(res);

		this.push(out + '\n'); // jshint ignore:line

		done();
	}

	function done () {
		fs.writeFileSync(output(opts.type) + '.csv', report.show(), 'utf8');
		fs.writeFileSync(output(opts.type) + '-failed.csv', failed.show(), 'utf8');
		console.log('done ' + count);
	}

	return { map: map, onfinish: done };
}

/*
 * main 
 */
function main (opts) {
	var	parse,
		file,
		read, write;

	opts = opts || {};
	
	cli.parse(process.argv);
	
	if (cli.useragents) {
		if (cli.useragents === true) {
			opts.useragents = config.input.useragents;
		}
		else {
			opts.useragents = cli.useragents;
		}
	}

	if (cli.tests) {
		if (cli.tests === true) {
			file = path.join(config.uaParser2.dir, config.uaParser2.tests);
		}
		else {
			file = cli.tests;
		}
		read = fs.createReadStream(file);
	}

	fileSync.createDirsSync(output(opts.type) + '-tests.json');
	write = fs.createWriteStream(output(opts.type) + '-tests.json', { flags: 'w', encoding: 'utf8'}); // contains all tests

	if (read) {
		read
			.pipe(new JsonStream())
			.pipe(new MapStream(parseTests(opts)))
			.pipe(write);
	}
	else {
		// only add
		// @substack
		console.log('##');
	}

}

function ua () {
	main({ type: 'ua' });
}

function engine () {
	main({ type: 'engine' });
}

function os () {
	main({ type: 'os' });
}

function device () {
	main({ type: 'device' });
}

function all () {
	main();
}

M.ua = ua;
M.engine = engine;
M.os = os;
M.device = device;
M.all = all;
module.exports = M;

//~ ua();
