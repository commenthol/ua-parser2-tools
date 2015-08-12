'use strict';

var	fs           = require('fs'),
	path         = require('path'),
	cli          = require('commander'),
	splitLine    = require('streamss').SplitLine,
	jsonArray    = require('streamss').JsonArray,
	through      = require('streamss').Through,
	_m           = require('mergee'),
	config       = require('../config'),
	pick         = require('./compact.js').pick,
	pickOne      = require('./compact.js').pickOne,
	fileSync     = require('./filesync'),
	ReportType   = require('./report').ReportType,
	ReportFailed = require('./report').ReportFailed,
	decode       = require('./decode').decode,
	parser       = require('ua-parser2'),
	deepEqual    = _m.deepEqual;

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
	var parse;

	if (!parser.parse) parser = parser(config.parser);

	switch (type) {
		case 'ua':
			parse = parser.parseUA;
			break;
		case 'os':
			parse = parser.parseOS;
			break;
		case 'engine':
			parse = parser.parseEngine;
			break;
		case 'device':
			parse = parser.parseDevice;
			break;
		default:
			parse = parser.parse;
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
			tmpR = parse(decode(string));

		opts.count += 1;

		if (opts.type) {
			res[opts.type] = tmpR;
		}
		else {
			res = tmpR;
		}
		res = pick(res) || {};
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

	var
		report = new ReportType(opts.type, cli.swap),
		add = addUserAgents(opts, report);

	function transform (obj) {
		add.add.call(this, obj); // jshint ignore:line
	}

	function finish () {
		fs.writeFileSync(output(opts.type) + '.csv', report.show(), 'utf8');
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
		var
			tmp = {},
			exp = {},
			res = {},
			out = '';

		opts.count += 1;

		tmp = parse(obj.string);

		if (tmp && opts.type) {
			// only one type
			res[opts.type] = tmp;
			if (obj[opts.type]) {
				exp[opts.type] = pickOne(obj[opts.type]);
				if (tmp.debug) {
					// copy debug info
					exp[opts.type].debug = tmp.debug;
				}
			}
			res = pick(res) || {};
		}
		else {
			// all types
			// copy debug info
			config.rules.params.forEach(function(p){
				if (tmp && tmp[p] && tmp[p].debug) {
					obj[p].debug = tmp[p].debug;
				}
			});
			exp = obj;
			res = pick(tmp);
		}

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
	var
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
			file = path.join(config.rules.dir, config.rules.tests);
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
	else if (opts.useragents) {
		read = fs.createReadStream(opts.useragents);
		read
			.pipe(splitLine({encoding: 'utf8', chomp: true}))
			.pipe(parseUas(opts))
			.pipe(write);
	}
	else {
		process.stdin
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
