'use strict';

var fs = require('fs');
var HashTree = require('hashtree').HashTree;
var through = require('streamss').Through;
var split = require('streamss').Split;
var decode = require('./decode').decode;

var uaParser = require('./requireparser')();

var M = {};

/**
 * filter testcases
 *
 * @param {Object} options
 * @param {String} fileName
 * @param {Function} callback
 * @return {Stream}
 */
M = function(options, fileName, fileNameOut, callback) {

	options = options || {};

	var streamIn = process.stdin;
	var streamOut = process.stdout;

	var ht = new HashTree();
	var parser, ord;
	var cnt, fnd;

	cnt = fnd = 0;
	process.stdout.write('\n');

	if (fileName) {
		streamIn = fs.createReadStream(fileName);
	}
	if (fileNameOut) {
		streamOut = fs.createWriteStream(fileNameOut);
	}

	// set parser type
	switch (options.type) {
		case 'os': {
			parser = uaParser.parseOS;
			ord = ['debug', 'family', 'major', 'minor', 'patch'];
			break;
		}
		case 'device': {
			parser = uaParser.parseDevice;
			ord = ['debug', 'brand', 'model', 'family'];
			break;
		}
		default:
		case 'ua': {
			parser = uaParser.parseUA;
			ord = ['debug', 'family', 'major', 'minor', 'patch'];
			break;
		}
	}

	if (options.ignore ) {
		ord.shift();
	}

	streamIn
		.pipe(split())
		.pipe(through(
			function (line) {
				var res,
					arr = [];

				line = line.toString('utf8');
				// line = decode(line.toString('utf8'));
				res = parser(line);

				if (cnt % 100 === 0) {
					if (!options.console)
						process.stdout.write('\r' + fnd + '\t' + cnt);
				}
				cnt++;

				if (res.debug) {
					ord.forEach(function(o){
						arr.push(res[o] || '');
					});
					if (!ht.get(arr)) {
						fnd++;
						ht.set(arr, line);
						if (options.short) {
							this.push(line + '\n');
						} else {
							this.push(arr.join('\t') + '\t' + line + '\n');
						}
					}
				}
			},
			function(){
				process.stdout.write('\n');
				callback(null, ht.tree());
			})
		)
		.pipe(streamOut);
};

module.exports = M;
