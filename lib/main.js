'use strict';

var	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	assert = require('assert'),
	cli = require('commander'),
	config = require('../config'),
	fileSync = require('./filesync'),
	parser = require('./requireparser'),
	helper = require('./helper.js'),
	splitLine = require('streamss').SplitLine,
	jsonArray = require('streamss').JsonArray,
	through = require('streamss').Through,
	deepEqual = require('./deepequal'),
	ReportType = require('./report').ReportType,
	ReportFailed = require('./report').ReportFailed,
	decode = require('./decode').decode,
	_m = require('mergee');

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

function addUserAgents (opts, report) {
	var	self = {},
		useragents = [],
		parse = selectParser(opts.type);

	self.addAll = function () {
		if (opts.useragents) {
			useragents = fileSync.readUserAgentsListSync(opts.useragents);
		}
		useragents.forEach(function(string){
			self.add(string);
		});
	};

	self.add = function (string) {
		var self = this;

		var	out = '',
			res = {},
			// tmpR = parse(decode(string));
			tmpR = parse(string);

		opts.count += 1;

		if (opts.type) {
			res[opts.type] = tmpR;
		}
		else {
			res = tmpR;
		}
		res = helper.compact.strip(res);
		res.string = string;

		out = report.add(res);
		if (opts.console) {
			console.log(out);
		}

		out = JSON.stringify(res);
		self.push(out + '\n'); // jshint ignore:line
	};

	return self;
}

/*
 * parse user-agents
 */
function parseUas (opts) {
	opts = opts || {};
	opts.count = 0;

	var	agents = {}, // hashmap to check on doubled user-agents
		report = new ReportType(opts.type, cli.swap),
		add = addUserAgents(opts, report);

	function transform (obj) {
		add.add.call(this, obj); // jshint ignore:line
	}

	function finish () {
		fs.writeFileSync(output(opts.type) + '.tsv', report.show(), 'utf8');
		console.log('done ' + opts.count);
	}

	return through.obj(transform).on('finish', finish);
}

/*
 * parse the tests
 */
function parseTests (opts) {
	opts = opts || {};
	opts.count = 0;

	var	agents = {},     // hashmap to check on doubled user-agents
		parse = selectParser(opts.type),
		report = new ReportType(opts.type, cli.swap),
		failed = new ReportFailed(opts.type, cli.swap),
		add = addUserAgents(opts, report);

	function transform (obj, enc, done) {
		var	i,
			tmpR = {},
			exp = {},
			res = {},
			out = '';

		opts.count += 1;

		tmpR = parse(obj.string);

		// normalize `res` and `exp` to allow comparison
		if (opts.type) {
			if (tmpR) {
				//~ res[opts.type] = _m.pick(tmpR, 'family,major,minor,patch,patchMinor,type,brand,model');
				// TODO remove
				res[opts.type] = _m.pick(tmpR, 'debug,major,minor,patch,patchMinor,brand,model');
			}
			if (obj[opts.type]){
				//~ exp[opts.type] = _m.pick(obj[opts.type], 'family,major,minor,patch,patchMinor,type,brand,model');
				// TODO remove
				exp[opts.type] = _m.pick(obj[opts.type], 'debug,major,minor,patch,patchMinor,brand,model');
				if (exp[opts.type].model) {
					exp[opts.type].model = exp[opts.type].model.replace(/[_/]/g, ' ').trim();
				}
			} else {
				exp[opts.type] = {};
			}
//~ console.log(tmpR)
//~ console.log(res)
//~ console.log(exp)
			// copy debug info
			if (tmpR && tmpR.debug && exp[opts.type]) {
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

		if (! deepEqual(res, exp)) {
			out = failed.add(res, exp, obj.string);
			console.error(out);
		}

		res.string = obj.string;
		out = report.add(res);
		if (opts.console) {
			console.log(out);
		}

		out = JSON.stringify(res);
		this.push(out + '\n'); // jshint ignore:line
		done();
	}

	function flush () {
		add.addAll.call(this); // jshint ignore:line
	}

	function finish () {
		fs.writeFileSync(output(opts.type) + '.csv', report.show(), 'utf8');
		fs.writeFileSync(output(opts.type) + '-failed.csv', failed.show(), 'utf8');
		console.log('done ' + opts.count);
	}

	return through.obj(transform, flush).on('finish', finish);
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

	opts.console = cli.console;

	fileSync.createDirsSync(output(opts.type) + '-tests.json');
	write = fs.createWriteStream(output(opts.type) + '-tests.json', { flags: 'w', encoding: 'utf8'}); // contains all tests

	if (read) {
		read
			.pipe(splitLine({encoding: 'utf8', chomp: true}))
			.pipe(jsonArray.parse())
			.pipe(parseTests(opts))
			.pipe(write);
	}
	else {
		read = fs.createReadStream(opts.useragents);
		read
			.pipe(splitLine({encoding: 'utf8', chomp: true}))
			.pipe(parseUas(opts))
			.pipe(write);
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
M.main = main;
module.exports = M;
