"use strict";

/*globals describe, it */

var 
	assert = require('assert'),
	sorter = require('../sorter.js');

describe('sorter test suite', function(){
	
	describe('- sort user-agents', function(){
		
		var userAgents = [
			'zZ',
			'zz',
			'1AA',
			'aa',
			'Mozilla UA1',
			'mozilla ua1',
			'aa1',
			'1aa',
			'mozilla 1a',
			'lal mozilla a',
			'Mozilla a',
			'l1al mozilla a'
		];
		
		it('- with lowerCaseSorter', function() {

			var result = userAgents.sort(sorter.lowerCaseSorter);
			var expected = ["1AA","1aa","aa","aa1","l1al mozilla a","lal mozilla a","mozilla 1a","Mozilla a","mozilla ua1","Mozilla UA1","zz","zZ"];

			assert.deepEqual(result, expected);
		});

		it('- with userAgentsSorter', function() {

			var result = userAgents.sort(sorter.userAgentsSorter);
			var expected = ["mozilla 1a","Mozilla a","Mozilla UA1","mozilla ua1","l1al mozilla a","lal mozilla a","1aa","1AA","aa","aa1","zz","zZ"];

			assert.deepEqual(result, expected);
		});
		
	});
	
	describe('- sort custom values', function(){
		
		var userAgents = [
			'zZ',
			'zz',
			'1AA',
			'aa',
			'Mozilla UA1',
			'mozilla ua1',
			'aa1',
			'1aa',
			'mozilla 1a',
			'lal mozilla a',
			'Mozilla a',
			'l1al mozilla a'
		];
		
		var values = [ 'zz', 'aa' ];
		
		it('- with arrayValueSorter', function() {

			var result = userAgents.sort(sorter.arrayValueSorter(values));
			var expected = ["zz","aa","1AA","1aa","Mozilla UA1","Mozilla a","aa1","l1al mozilla a","lal mozilla a","mozilla 1a","mozilla ua1","zZ"];

			assert.deepEqual(result, expected);
		});
		
		it('- with arrayValueSorter lowercase', function() {

			var result = userAgents.sort(sorter.arrayValueSorter(values, { lowerCase: true }));
			var expected = 
			["zz","aa","1AA","1aa","aa1","l1al mozilla a","lal mozilla a","mozilla 1a","Mozilla a","Mozilla UA1","mozilla ua1","zZ"];

			assert.deepEqual(result, expected);
		});

	});
	
});
