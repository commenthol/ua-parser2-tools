/*!
 * Report data as CVS with a tab seperator
 * 
 * Copyright (c) 2013 Commenthol 
 * Released under the MIT license
 */

"use strict";

var	M = {};

// constants
var	SEP = '\t',
	DIGITS = /^\d/;

function startsWithDigit(str) {
  return DIGITS.test(str);
}

function isUndefinedOrNull (obj) {
	return (obj === null || obj === undefined ? true : false );
}

function toVersionString (obj) {
  var output = '';
  if (!isUndefinedOrNull(obj.major)) {
    output += obj.major;
    if (!isUndefinedOrNull(obj.minor)) {
      output += '.' + obj.minor;
      if (!isUndefinedOrNull(obj.patch)) {
        if (startsWithDigit(obj.patch)) { output += '.'; }
        output += obj.patch;
        if (!isUndefinedOrNull(obj.patchMinor)) {
          if (startsWithDigit(obj.patchMinor)) { output += '.'; }
          output += obj.patchMinor;
        }
      }
    }
  }
  return output;
}

// ---- Base Report
function Report(fields) {
	this._fields = fields;
	this._list = [];
}

Report.prototype._head = function() {
	var arr = [];

	this._fields.forEach (function(p) {
		arr.push('#'+p);
	});
	return arr;
};

Report.prototype.add = function(obj) {
	var
		str,
		arr = [];

	this._fields.forEach (function(p) {
		arr.push(obj[p] || '');
	});
	str = arr.join(SEP);
	this._list.push(str);
	return str;
};

Report.prototype.show = function(obj) {
	var list = this._list.sort().slice(0);

	list.unshift(this._head().join(SEP));
	return (list.join('\n') + '\n');
};

Report.prototype.length = function() {
	return this._list.length;
};

// ----
function ReportType(type, swap) {
	this.type = type;
	this.swap = swap;
	this.fields = this._selectFields();
	this.report = new Report(this.fields);
}

ReportType.prototype.add = function (obj) {
	var	tmp = {},
		type = this.type,
		fields = this.fields;

	if (type) {
		fields.forEach(function(f) {
			if (f === 'string') {
				tmp[f] = obj[f];
			}
			else if (f === 'version') {
				tmp[f] = ( obj[type] ? toVersionString(obj[type]) : '' );
			}
			else {
				tmp[f] = ( obj[type] ? obj[type][f] : '' );
			}
		});
	}
	else {
		fields.forEach(function(f) {
			var s = f.split('.');
			if (f === 'string') {
				tmp[f] = obj[f];
			}
			else if (s[1] === 'version') {
				tmp[f] = ( obj[s[0]] ? toVersionString(obj[s[0]]) : '' );
			}
			else {
				tmp[f] = ( obj[s[0]] ? obj[s[0]][s[1]] : '' );
			}
		});
	}
	return this.report.add(tmp);
};

ReportType.prototype.show = function () {
	return this.report.show();
};

ReportType.prototype._selectFields = function () {
	var	fields;

	switch (this.type) {
		case 'ua':
		case 'engine':
		case 'os':
			fields = [ 'debug', 'family', 'version', 'string' ];
			if (this.swap) {
				fields = [ 'family', 'version', 'debug', 'string' ];
			}
			break;
		case 'device':
			fields = [ 'debug', 'brand', 'model', 'string' ];
			if (this.swap) {
				fields = [ 'brand', 'model', 'debug', 'string' ];
			}
			break;
		default:
			fields = [
				'ua.debug', 'ua.family', 'ua.version',
				'engine.debug', 'engine.family', 'engine.version',
				'os.debug', 'os.family', 'os.version',
				'device.debug', 'device.brand', 'device.model',
				'string' ];
			break;
	}
	return fields;
};

// ----
function ReportFailed(type, swap) {
	this.type = type;
	this.swap = swap;
	this.fields = this._selectFields();
	this.report = new Report(this.fields);
}

ReportFailed.prototype.add = function (act, exp, string) {
	var	tmp = {},
		type = this.type,
		fields = this.fields;
	if (type) {
		fields.forEach(function(f) {
			var s = f.split('.');
			if (f === 'string') {
				tmp[f] = string;
			}
			else if (s[0] === 'debug') {
				tmp[f] = ( act[type] ? act[type][s[0]] : '' );
			}
			else if (s[1] === 'version') {
				if (s[0] === 'is' ) {
					tmp[f] = ( act[type] ? toVersionString(act[type]) : '' );
				}
				else {
					tmp[f] = ( exp[type] ? toVersionString(exp[type]) : '' );
				}	
			}
			else {
				if (s[0] === 'is' ) {
					tmp[f] = ( act[type] ? act[type][s[1]] : '' );
				}
				else {
					tmp[f] = ( exp[type] ? exp[type][s[1]] : '' );
				}	
			}
		});
	}
	else {
		fields.forEach(function(f) {
			var s = f.split('.');
			if (f === 'string') {
				tmp[f] = exp[f];
			}
			else if (s[1] === 'debug') {
				tmp[f] = ( act[s[0]] ? act[s[0]][s[1]] : '' );
			}
			else if (s[2] === 'version') {
				if (s[1] === 'is' ) {
					tmp[f] = ( act[s[0]] ? toVersionString(act[s[0]]) : '' );
				}
				else {
					tmp[f] = ( exp[s[0]] ? toVersionString(exp[s[0]]) : '' );
				}
			}
			else {
				if (s[1] === 'is' ) {
					tmp[f] = ( act[s[0]] ? act[s[0]][s[2]] : '' );
				}
				else {
					tmp[f] = ( exp[s[0]] ? exp[s[0]][s[2]] : '' );
				}
			}
		});
	}
	return this.report.add(tmp);
};

ReportFailed.prototype.show = function () {
	return this.report.show();
};

ReportFailed.prototype._selectFields = function () {
	var	fields;

	switch (this.type) {
		case 'ua':
		case 'engine':
		case 'os':
			fields = [ 'debug', 'is.family', 'was.family', 'is.version', 'was.version', 'string' ];
			if (this.swap) {
				fields = [ 'is.family', 'was.family', 'is.version', 'was.version', 'debug', 'string' ];
			}
			break;
		case 'device':
			fields = [ 'debug', 'is.brand', 'was.brand', 'is.model', 'was.model', 'string' ];
			if (this.swap) {
				fields = [ 'is.brand', 'was.brand', 'is.model', 'was.model', 'debug', 'string' ];
			}
			break;
		default:
			fields = [
				'ua.debug', 'ua.is.family', 'ua.was.family', 'ua.is.version', 'ua.was.version',
				'engine.debug', 'engine.is.family', 'engine.was.family', 'engine.is.version', 'engine.was.version',
				'os.debug', 'os.is.family', 'os.was.family', 'os.is.version', 'os.was.version',
				'device.debug', 'device.is.brand', 'device.was.brand', 'device.is.model', 'device.was.model',
				'string' ];
			break;
	}
	return fields;
};

// exports
M.Report = Report;
M.ReportType = ReportType;
M.ReportFailed = ReportFailed;
module.exports = M;
