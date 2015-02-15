'use strict';

var through = require('streamss').Through;
var decode = require('./decode').decode;

var M = {};

var SORTER = [
	/^Mozilla\/\d\.0 .*(?:AppleWebKit|Chrome|Gecko)/,
	/^Mozilla\/\d/,
	/^Mozilla/,
	/Mozilla/
];

/**
 * sort user-agents
 *
 * first by strings staring with "Mozilla"
 * then strings containing "Mozilla"
 * and then all the others
 *
 * @return {Function} (a, b) for sorting
 */
M.userAgentsSorter = function (a, b) {
	var aNum, bNum, i;

	aNum = bNum = SORTER.length;

	for (i = SORTER.length-1 ; i >= 0; i--) {
		if (SORTER[i].test(a)) {
			aNum = i;
		}
		if (SORTER[i].test(b)) {
			bNum = i;
		}
	}

	if (aNum < bNum) {
		return -1;
	}
	if (aNum > bNum) {
		return 1;
	}
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
};

M.sort = function(options) {
	var log,
		arr = [];

	options = options || {};
	if (options.sorter) {
		SORTER = options.sorter;
	}
	log = options.log;

	log && log('...start receiving');
	function transform(line, enc) {
		line = decode(line.toString('utf8'));
		arr.push(line);
	}

	function flush() {
		log && log('...start sorting ' + arr.length + ' user-agents');
		arr = arr.sort(M.userAgentsSorter);
		log && log('...stop sorting');
		this.push(arr.join('\n'));
	}

	return through(transform, flush);
};

module.exports = M;

