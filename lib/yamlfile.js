/**
 * handle yaml file operations
 * @license MIT
 * @copyright 2015 commenthol@gmail.com
 */

'use strict';

var fs = require('fs'),
	jsyaml = require('js-yaml');


var yamlFile = {

	/**
	 * sync loading of `filename`
	 * @throws {Error} if filename not found or on parsing errors
	 * @param {String} filename - yaml filename
	 * @return {Object} - parsed contents
	 */
	loadSync: function(filename) {
		var obj,
			content;

		content = fs.readFileSync(filename, 'utf8');
		if (content) {
			obj = jsyaml.load(content);
		}
		return obj;
	},

	/**
	 * @callback loadCallback
	 * @param {Error} error - error or null
	 * @param {Object} obj - parsed contents
	 */
	/**
	 * async loading of filename
	 * @param {String} filename - yaml filename
	 * @param {loadCallback} callback
	 */
	load: function(filename, callback) {
		fs.readFile(filename, 'utf8', function (error, content){
			var obj;

			if (!error && content) {
				try {
					obj = jsyaml.load(content);
				}
				catch (e) {
					error = e;
				}
			}
			if (callback) callback(error, obj);
		});
	},

	/**
	 * watch filename for changes
	 * @param {String} filename - yaml filename
	 * @param {Function} callback
	 */
	watch: function(filename, callback) {
		fs.watchFile(filename, function (curr, prev){
			if (curr.mtime === prev.mtime) {
				return;
			}
			if (callback) callback();
		});
	},

	/**
	 * synchronously save object to yaml file
	 */
	saveSync: function(filename, obj) {
		return fs.writeFileSync(filename, jsyaml.safeDump(obj), 'utf8');
	},
};

module.exports = yamlFile;
