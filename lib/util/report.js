/*!
 * Report data as CVS with a tab seperator
 * 
 * Copyright (c) 2013 Commenthol 
 * Released under the MIT license
 */

"use strict";

/**
 * Module dependencies
 */

var extend = require('./extend').extend;

/**
 * Module functions
 */
 
/**
 * Base class for reports
 * `fields` is an Array of items which are used as keys to add data into 
 * the report.
 * The data-object in function `add` shall contain the same field-names 
 * as keys to transpose the data.
 * 
 * @param {Array} fields
 * @return {Object} constructed object
 * @api private
 */
function report(fields) {
  var self = {};
  var _list = [];

  /**
   * Generate table header
   * the field names are used from `fields`
   * @return {Array}
   * @api private
   */
  function csvHead() {
    var arr = [];
    fields.forEach(function(p){
      arr.push('#'+p);
    });
    return arr;
  }

  /**
   * Transpose the `obj` keys into the given `fields`order.
   * `obj` needs to have keys with the same names as given in `fields`.
   * @param {Object} obj 
   * @return {Array}
   * @api private
   */
  function csvLine(obj) {
    var arr = [];
    fields.forEach (function(p) {
      arr.push(obj[p] || '');
    });
    return arr;
  }  

  /**
   * Add header information
   * @api private 
   */
  function _addHead() {
    var arr = [];
    arr = csvHead();
    _list.unshift(arr.join('\t'));
  }

  /**
   * Add new data
   * Transpose the `obj` keys into the given `fields` order.
   * `obj` needs to have keys with the same names as given in `fields`.
   * @param {Object} obj 
   * @return {String} : String of joined values
   * @api public
   */
  self.add = function(obj) {
    var arr = [],
        str;    
    arr = csvLine(obj);
    str = arr.join('\t');
    _list.push(str);
    return str;
  }; 
  
  /**
   * Show the collected information
   * @return {String} 
   */
  self.show = function() {
    _list = _list.sort();
    _addHead();
    return _list.join('\n');
  };
  
  /**
   * Get length of list
   * @return {Number} Length of list
   */
  self.length = function() {
    return _list.length;
  };

  return self;
}

/**
 * Collect info of a parsed user-agent in csv tab separated style
 * 
 * @param    {Object}  options
 * @property {Boolean} options.console   - true: print out information while calling add()
 * @property {Boolean} options.family    - false: do not add family field
 * @property {Boolean} options.debug     - false: do not add debug field
 * @property {Boolean} options.swapdebug - if debug == true then debug info is printed in the swapdebug field
 * @property {Array}   options.fields    - fields used to add data 
 * 
 * @return   {Object}  constructed object inherited from `report`  
 */
function reportData(options) {
  var self;
  var base;
  var i;
  var _fields = options.fields || [ 'debug', 'family', 'swapdebug', 'user_agent_string' ];
  
  options = extend({ 
    console: false, 
    debug: true, 
    family: false }, options);
  
  // correct `_fields` according to `options`
  _fields = _fields.filter(function(p){
    if (/^family$/.test(p) && options.family === false) {
      return false;
    }
    if (/^type$/.test(p) && options.type === false) {
      return false;
    }
    if (/^(?:swap)?debug$/.test(p) && options.debug === false) {
      return false;
    }
    if (/^swapdebug$/.test(p) && options.swapdebug === false) {
      return false;
    }
    if (/^debug$/.test(p) && options.swapdebug) {
      return false;
    }
    return true;
  });  
    
  _fields = _fields.map(function(p){
    if (/^swapdebug$/.test(p) && options.swapdebug) {
      return 'debug';
    } 
    return p;
  });
  
  base = report(_fields);
  // inherit from `report`
  self = extend(base, self);
        
  /**
   * Add data to the report
   * @param {String} string : user-agent-string
   * @param {Object} data : parsed user-agent-string
   */
  self.add = function(string, data) {
    var 
      str, 
      version = data.toVersionString ? data.toVersionString() : '';
    str = base.add(extend(data, {user_agent_string: string, version: version}));
    if (options.console) {
      console.log(str);
    }
  }; 
    
  return self;
}

module.exports = { 
  report: report,
  reportData: reportData
};
