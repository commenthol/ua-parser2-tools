"use strict";

/*globals describe, it*/

var 
	assert = require('assert'),
	decode = require('../decode.js').decode;

describe('user agent decoding test', function(){
	
	it('- normal user-agent', function() {
		
		var 
			ua = "HTC_P5500 Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; PPC)/UC Browser7.2.2.51",
			result = decode(ua);
		
		assert.equal(result, ua);
	});

	it('- + encoded user-agent', function() {

		var 
			ua = "HTC_P4550+Mozilla/4.0+(compatible;+MSIE+6.0;+Windows+CE;+IEMobile+7.6)",
			expected = 'HTC_P4550 Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 7.6)',
			result = decode(ua);

		assert.equal(result, expected);
	});

	it('- escaped user-agent', function() {

		var 
			ua = "Mozilla/5.0%20(Linux;%20U;%20Android%202.3.3;%20es-us;%20HTC-A9192/1.0%20Build/GRI40)%20AppleWebKit/533.1%20(KHTML,%20like%20Gecko)%20Version/4.0%20Mobile%20Safari/533.1",
			expected = 'Mozilla/5.0 (Linux; U; Android 2.3.3; es-us; HTC-A9192/1.0 Build/GRI40) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
			result = decode(ua);

		assert.equal(result, expected);
	});

	it('- normal user-agent with +', function() {

		var 
			ua = "Mozilla/5.0 (Linux; Android 4.3; One X+ Build/JLS36G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.72 Mobile Safari/537.36",
			expected = ua,
			result = decode(ua);

		assert.equal(result, expected);
	});
	
	it('- useragent with url and + encoding', function(){
	
		var 
			ua = 'BlackBerry9800%2f6.0.0.668+Profile%2fMIDP-2.0+Configuration%2fCLDC-1.1+VendorID%2f124',
			expected = 'BlackBerry9800/6.0.0.668 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/124',
			result = decode(ua);
		assert.equal(result, expected);
	});

	it('- mixed useragent with url encoding', function(){
		var 
			ua = 'Mozilla%2F5.0%20(Symbian%2F3;%20Series60%2F5.4%20Nokia700%2F112.010.1404;%20Profile%2FMIDP%2D2.1%20Configuration%2FCLDC%2D1.1%20)%20AppleWebKit%2F535.1%20(KHTML,%20like%20Gecko)%20NokiaBrowser%2F8.2.1.20%20Mobile%20Safari%2F535.1%203gpp%2Dgba 3gpp-gba',
			expected = 'Mozilla/5.0 (Symbian/3; Series60/5.4 Nokia700/112.010.1404; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/535.1 (KHTML, like Gecko) NokiaBrowser/8.2.1.20 Mobile Safari/535.1 3gpp-gba 3gpp-gba',
			result = decode(ua);
		assert.equal(result, expected);
	});

});
