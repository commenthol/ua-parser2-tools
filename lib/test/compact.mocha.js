'use strict';

/* global describe, it */

var
	assert = require('assert'),
	pick = require('../compact').pick,
	pickOne = require('../compact').pickOne;

describe('pick', function(){

	it('can pick only relevant results', function(){
		var inp = {
				ua: { family: 'Other', major: null, minor: null, patch: null },
				engine: { family: 'Other', major: null, minor: null, patch: null },
				os: { family: 'Other', major: null, minor: null, patch: null },
				device: { family: 'DoCoMo N905imyu', brand: 'DoCoMo', model: 'N905imyu' },
				string: 'DoCoMo/2.0 N905imyu(c100;TB;W24H16)'
			},
			exp = {
				device: { family: 'DoCoMo N905imyu', brand: 'DoCoMo', model: 'N905imyu' },
				string: 'DoCoMo/2.0 N905imyu(c100;TB;W24H16)'
			};

		var res = pick(inp);
		assert.deepEqual(res, exp);
	});

	it('can return undefined', function(){
		var inp = {
				ua: {"family":"Other","major":null,"minor":null,"patch":null}
			};

		var res = pick(inp);
		assert.deepEqual(res, undefined);
	});
});


describe('pickOne', function(){

	it('can pick only relevant results', function(){
		var inp = {"family":"Test","major":"1","minor":"4","patch":null},
			exp = { family: 'Test', major: '1', minor: '4' };

		var res = pickOne(inp);
		assert.deepEqual(res, exp);
	});

	it('can return undefined', function(){
		var inp = {"family":"Other","major":null,"minor":null,"patch":null};

		var res = pickOne(inp);
		assert.deepEqual(res, undefined);
	});
});

