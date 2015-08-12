/*!
 * Download regexes and test_resources from config.source
 * 
 * Copyright (c) 2013 Commenthol 
 * Released under the MIT license
 */

"use strict";

var 
  config = require('../../config'),
  https = require('https'),
  fs = require('fs'),
  path = require('path');

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  console.log('... downloading ' + url); 
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      cb();
    });
  });
};

var mkdir = function(pathname) {
  
  var dirs = path.normalize(pathname).split('/');
  var _path = '';
  
  dirs.map(function(p){
    _path += p + '/';
    if (! fs.existsSync(_path)) {
      console.log(_path);
      fs.mkdirSync(_path);
    }
  });
  
}

var url = config.source + '/' + config.ua_parser.regexes;
var dest = config.ua_parser.dir + '/' + config.ua_parser.regexes;

mkdir(config.ua_parser.dir + '/test_resources');

download(url, dest, (function(){
  var u = url;
  console.log('... done ' + u);
})());

['ua', 'os', 'device'].map(function(p){
  var url  = config.source + '/test_resources/' + config.ua_parser.test_resources[p];
  var dest = config.ua_parser.dir + '/test_resources/' + config.ua_parser.test_resources[p];
  download(url, dest, (function(){
    var u = url;
    console.log('... done ' + u);
  })());
});


