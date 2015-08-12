/**
 * Copyright (c) 2013 Commenthol 
 * Released under the MIT license
 */

"use strict";

var path = require('path');

function absolutize(pathname) {
  if (/^[^\/]/.test(pathname)) {
    pathname = __dirname + '/../../' + pathname;
  }
  return path.normalize(pathname);
}  

var M = module.exports;

/**
 * convert options from cli to internal options
 */
M.convert = function convert(options){
  
  var 
    filename,
    opts = {};
  
  if (options.ua) {
    opts.file = absolutize(options.ua);
  }
  if (options.out) {
    filename = options.out.replace(/\.[^\.]*$/, '');
    opts.listfile = (filename + '.csv');
    opts.logfile  = (filename + '.log.csv');
  }
  if (options.tc) {
    opts.testcases = true;
  }
  if (options.tcin) {
    opts.testcasesin = absolutize(options.tcin);
    opts.testcases = true;
  }
  if (options.tcout) {
    opts.testcasesout = absolutize(options.tcout);
  }
  if (options.console) {
    opts.console = true;
  }
  if (options.other) {
    opts.other = true;
  } 
  if (options.nodebug) {
    opts.debug = false;
  } 
  if (options.swapdebug) {
    opts.swapdebug = true;
  } 
  if (options.nofamily) {
    opts.family = false;
  } 
  if (options.noappend) {
    opts.appenduas = false;
  }

  return opts;
};
