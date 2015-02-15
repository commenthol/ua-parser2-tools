#!/usr/bin/env node

"use strict";

/*!
 * Sorting User-Agents
 */

/**
 * Dependencies
 */
var fs = require('fs'),
	cli = require('commander'),
	path = require('path'),
	through = require('streamss').Through,
	split = require('streamss').Split,
	sorter = require('../lib/sorter');

var sorterOptions = {
	sorter: [
		/^Mozilla\/\d\.0 .*(?:AppleWebKit|Chrome|Gecko)/,
		/^Mozilla\/\d/,
		/^Mozilla/,
		/Mozilla/
	]
};

/**
 * command line interface
 */
cli
	.option('-u, --ua <file>', 'Read User-Agents from <file>')
	.option('-o, --out <file>', 'Write output file to <file>')
	.parse(process.argv);

(function main(options) {
	var sIn  = process.stdin,
		sOut = process.stdout;

	if (options.ua) {
		sIn = fs.createReadStream(options.ua);
	}
	if (options.out) {
		sOut = fs.createWriteStream(path.resolve(__dirname, options.out));
	}

	sIn
		.pipe(split())
		.pipe(sorter.sort(sorterOptions))
		.pipe(sOut)
		.on('close', function(){
			cli.ok('writing output to "'+ options.out +'"');
		});
})(cli);

