#!/usr/bin/env node

"use strict";

/*!
 * get uniq set of matched user-agents
 * requires sorting your input data with `sort.js` first
 */

/**
 * Dependencies
 */
var cli = require('commander'),
	path = require('path'),
	filter = require('../lib/filter.js');

/**
 * command line interface
 */
cli
	.option('-u, --ua <file>', 'Read User-Agents from <file>')
	.option('-o, --out <file>', 'Write output file to <file>')
	.option('-t, --type <str>', 'Type of parser [ua|os|device]', 'string')
	.option('-r, --tree', 'Write tree')
	.option('-s, --short', 'Print short output (user-agents only)')
	.option('-i, --ignore', 'Ignore debug information from `regexes.yaml`')
	.parse(process.argv);

(function main(options) {
	options.out = path.resolve(__dirname, ( options.out || '../report/uniq.csv'));

	if (! options.ua) {
		console.error('need -u as option');
		return;
	}
	if (! options.type) {
		console.error('need -t as option');
		return;
	}
	if ( ! /^(ua|os|device)$/.test(options.type) ) {
		console.error('only -t [ua|os|device] allowed');
		return;
	}

	filter(options,
		path.resolve(__dirname + '/..', options.ua),
		options.out,
		function(err, data){
			if (options.tree) {
				fs.writeFileSync(__dirname + '/../report/tree.json', JSON.stringify(data, null, 2));
			}
			console.log('writing output to "'+ options.out +'"');
		});
})(cli);
