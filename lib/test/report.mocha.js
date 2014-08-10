'use strict';

/* jshint describe, it */

var
	assert = require('assert'),
	Report = require('../report');

describe('#Report', function(){
	it('fill report and get it', function(){

		var l,
			exp,
			r = new Report(['one', 'two', 'three']);

		exp = 
			'#one	#two	#three\n'+
			'1	2	3\n'+
			'2	3	1\n'+
			'3	1	2\n';

		r.add({one: 1, two: 2, three: 3});
		r.add({one: 3, two: 1, three: 2});
		r.add({one: 2, two: 3, three: 1});

		assert.equal(r.show(), exp);
	});
});
