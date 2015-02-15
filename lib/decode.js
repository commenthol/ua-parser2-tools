'use strict';

/**
 * Correct encoded User-Agent Strings
 */

var M = module.exports;

var URLENC = /%[0-9a-f]{2}/i;
var PLUSES = /\+.[^\+]*\+/;

M.decode = function (userAgent) {
	var tmp;

	// check url encoding
	if (URLENC.test(userAgent)) {
		userAgent = unescape(userAgent);
	}
	// no spaces found
	if ( !~userAgent.indexOf(' ') && PLUSES.test(userAgent) ) {
		userAgent = userAgent.replace(/\+/g, ' ');
	}
	return userAgent;
}
