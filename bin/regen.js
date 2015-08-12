#!/usr/bin/env node

/*!
 * Regenerate test cases
 */

'use strict';

var
	fs        = require('fs'),
	path      = require('path'),
	cmd       = require('commander'),
	splitLine = require('streamss').SplitLine,
	jsonArray = require('streamss').JsonArray,
	through   = require('streamss').Through,
	pick      = require('../lib/compact').pick,
	conf      = require('../config'),
	parser    = require('ua-parser2')(conf.parser);

var
	pwd = process.cwd(),
	badAgents = [],
	agents = {},
	basedir = path.join(conf.rules.dir, 'test_resources'),
	start = Date.now(),
	count = 0,
	config = {
		params: [ 'ua', 'engine', 'os', 'device' ],
		props : ['major', 'minor', 'patch', 'patchMinor', 'brand', 'model', 'name', 'type', 'size'],
		testsFile: path.join(basedir, 'tests.json'),      // default tests file
		outFile  : path.join(basedir, 'new-tests.json'),  // new generated tests file
		badFile  : path.join(basedir, 'bad-tests.json')   // file containing bad matches
	};

/// the program
cmd
	.option('-o, --out <file>',      'output regenerated tests file <file>')
	.option('-i, --in <file>',       'input tests file <file>')
	.option('-b, --badtests <file>', 'output failing tests to <file>')
	.option('-c, --console',         'output details to console')
	.option('-d, --debug',           'add debug info if present')
	.parse(process.argv);

console.log();

if (cmd.in) {
	config.testsFile = path.resolve(pwd, cmd.in);
}
else if (! cmd.console) {
	console.log('    reading tests from:       ' + path.relative(pwd, config.testsFile) );
}

if (cmd.out) {
	config.outFile = path.resolve(pwd, cmd.out);
}
else if (! cmd.console) {
	console.log('    regenerate tests to:      ' + path.relative(pwd, config.outFile) );
}

if (cmd.badtests) {
	config.badFile = path.resolve(pwd, cmd.badtests);
}
else if (! cmd.console) {
	console.log('    writing failing tests to: ' + path.relative(pwd, config.badFile) );
}

/*
 * paring finished
 */
function parseDone() {

	var time = (Date.now() - start);
	console.error(
		'    Processing took: ' + (time/1000|0) + ' s\n' +
		'    Number of User-Agents: ' + count + '\n' +
		'    Avg: ' + (((time*1000/count)|0)/1000) + ' ms per User-Agent\n'
	);

	if (badAgents.length > 0) {
		console.error('    Failing tests: ' + badAgents.length + '\n');
		fs.writeFileSync(config.badFile, badAgents.join('\n'), 'utf8');
	}
}

/**
 * normalize obj
 */
function toString(obj) {
	return JSON.stringify(obj);
}

/*
 * parse a single user-agent and write the result to the stream
 */
function parse(obj, encoding, done) {
	var
		i,
		out = [],
		dbg = {},
		exp, act,
		res, resStr;

	count += 1;

	res = pick(parser.parse(obj.string));
	res.string = obj.string;

	obj = pick(obj);

	if (! cmd.debug ) {
		for (i in res) {
			if (res[i].debug) {
				dbg[i] = res[i].debug;
				delete(res[i].debug);
			}
		}
	}

	if (agents[obj.string]) {
		if (cmd.console) {
			console.error('    Doubled testcase: ' + obj.string);
		}
		return done();
	}
	agents[obj.string] = 1;

	exp    = toString(obj);
	resStr = toString(res);

	if (exp !== resStr) {
		badAgents.push(exp);
		if (cmd.console) {
			out.push('== ' + obj.string);
			config.params.forEach(function(p){
				exp = toString(obj[p]);
				act = toString(res[p]);
				if (exp !== act) {
					out.push('-- ' + p + ': ' + ( dbg[p] || '' ) );
					out.push('< ' + exp);
					out.push('> ' + act);
				}
			});
			console.log(out.join('\n') + '\n');
		}
	}

	this.push(resStr + '\n'); // jshint ignore:line

	done();
}

/*
 * the pipe - appending new parse results to the tests output
 */
fs.createReadStream(config.testsFile, { encoding: 'utf8' })
	.pipe(splitLine({chomp: true}))
	.pipe(jsonArray.parse())
	.pipe(through.obj(parse, parseDone))
	.pipe(fs.createWriteStream(config.outFile, { flags: 'w', encoding: 'utf8'}));
