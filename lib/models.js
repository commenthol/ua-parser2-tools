#!/usr/bin/env node

/**
 * @license MIT
 * @copyright 2015 commenthol
 */

'use strict';

var fs       = require('fs'),
	path     = require('path'),
	_m       = require('mergee'),
	yamlFile = require('../lib/yamlfile'),
	config   = require('../config'),
	HashTree = require('hashtree').HashTree,
	hashTree = require('hashtree').hashTree,
	split    = require('streamss').SplitLine,
	through  = require('streamss').Through,
	uaParser = require('ua-parser2')(config.parser);

var CSVSEP = '\t';

/**
 * @class
 * @param {String} opts.input
 * @param {String} opts.output
 * @param {String} opts.csv
 */
function Models (opts) {
	if (!(this instanceof Models)) {
		return new Models(opts);
	}

	opts = opts || {};

	// read file from
	this._filename    = opts.input  || path.join(config.rules.dir, config.rules.models);
	// save file to
	this._filenameOut = opts.output || path.join(process.cwd(), 'models-new.yaml');
	// save file to
	this._filenameCsv = opts.csv    || path.join(process.cwd(), 'models.csv');
	// our models
	this._models = null,
	// case insensitive searching
	this._lower = new HashTree();
}

Models.static = {
	/**
	 * load useragents text file
	 * list of user-agents strings separated by newline
	 */
	uaFile: {
		loadSync: function(filename) {
			var uas = fs.readFileSync(filename, 'utf8');
			return uas.split('\n');
		},
	},
	/**
	 * displayResolution mapper
	 */
	displayResolution: function(string) {
		var map = {
			"QQVGA"     : "160x120",
			"HQVGA"     : "240x160",
			"QVGA"      : "320x240",
			"WQVGA"     : "400x240",
			"HVGA"      : "480x320",
			"VGA"       : "640x480",
			"WVGA"      : "768x480",
			"FWVGA"     : "854x480",
			"SVGA"      : "800x600",
			"DVGA"      : "960x640",
			"WSVGA"     : "1024x576",
			"XGA"       : "1024x768",
			"WXGA"      : "1366x768",
			"XGA+"      : "1152x864",
			"WXGA+"     : "1440x900",
			"SXGA"      : "1280x1024",
			"SXGA+"     : "1400x1050",
			"WSXGA+"    : "1680x1050",
			"UXGA"      : "1600x1200",
			"WUXGA"     : "1920x1200",
			"QWXGA"     : "2048x1152",
			"QXGA"      : "2048x1536",
			"WQXGA"     : "2560x1600",
			"QSXGA"     : "2560x2048",
			"WQSXGA"    : "3200x2048",
			"QUXGA"     : "3200x2400",
			"WQUXGA"    : "3840x2400",
			"HXGA"      : "4096x3072",
			"WHXGA"     : "5120x3200",
			"HSXGA"     : "5120x4096",
			"WHSXGA"    : "6400x4096",
			"HUXGA"     : "6400x4800",
			"WHUXGA"    : "7680x4800",
			"nHD"       : "640x360",
			"qHD"       : "960x540",
			"HD"        : "1280x720",
			"FHD"       : "1920x1080",
			"QHD"       : "2560x1440",
			"WQXGA+"    : "3200x1800",
			"UHD 4K"    : "3840x2160",
			"UHD+ 5K"   : "5120x2880",
			"FUHD 8K"   : "7680x4320",
			"QUHD 16K"  : "15360x8640",
		};
		return map(string) || string;
	}
};

Models.prototype = {
	/**
	 * load yaml file
	 */
	load: function() {
		this._models = yamlFile.loadSync(this._filename).device_models;
	},
	/**
	 * save yaml file
	 */
	save: function() {
		yamlFile.saveSync(this._filenameOut, { device_models: this._models });
	},
	/**
	 * set lower case references
	 */
	lower: function(){
		var brand,
			model;

		for (brand in this._models) {
			this.setLowerBrand(brand);
			for (model in this._models[brand]) {
				this.setLowerModel(brand, model);
			}
		}
	},
	/**
	 * get lower case brand - if unset set it
	 */
	lowerBrand: function(brand) {
		var b;
		if (brand) {
			b = this._lower.get([brand.toLowerCase(), '_brand']);
			if (!b) {
				this.setLowerBrand(brand);
				b = brand;
			}
		}
		return b;
	},
	/**
	 * get lower case model - if unset set it
	 */
	lowerModel: function(brand, model) {
		var m;
		if (brand && model) {
			m = this._lower.get([brand.toLowerCase(), model.toLowerCase()]);
			if (!m) {
				this.setLowerModel(brand, model);
				m = model;
			}
		}
		return m;
	},
	/**
	 * set lower case brand
	 */
	setLowerBrand: function(brand) {
		return this._lower.set([brand.toLowerCase()], { _brand: brand });
	},
	/**
	 * set lower case model based on brand
	 */
	setLowerModel: function(brand, model) {
		return this._lower.set([brand.toLowerCase(), model.toLowerCase()], model);
	},
	/**
	 * check references
	 * if a leaf contains .brand and/or .model it is flaged as ._ref=true
	 */
	DISABLED__refs: function() {
		var count = 0,
			tmpB,
			tmpM,
			brand,
			model,
			device;

		// detect references
		for (brand in this._models) {
			for (model in this._models[brand]) {

				device = this._models[brand][model] || {};

				if (device.brand && device.brand !== brand) {
					// normalize brand
					tmpB = this.lowerBrand(device.brand);
					if (tmpB) {
						device.brand = tmpB;
					}
					else {
						this.setLowerBrand(device.brand);
						console.error('brand not found ' + device.brand);
					}
					device._ref = true;
				}
				if (device.model && device.model !== model) {
					tmpB = device.brand || brand;
					tmpM = this.lowerModel(tmpB, device.model);

					if (this._models[tmpB][device.model]) {
						device._ref = true;
					}
					else if (tmpM && this._models[tmpB][tmpM]) {
						// normalize model
						device.model = tmpM;
						device._ref = true;
					}
				}
				if (!device._ref) {
					count++;
				}
			}
		}

		console.error('Models found ' + count);
	},
	/**
	 * loop over all models and clean-up structure
	 */
	DISABLED__loop: function() {
		var count = 0,
			tmpB,
			tmpM,
			brand,
			model,
			device,
			lcBrand,
			lcModel;

		this.refs();

		// resolve references
		for (brand in this._models) {
			for (model in this._models[brand]) {
				var tmp;

				device = this._models[brand][model] || {};

				if (device._ref) {
					// reset node
					this._models[brand][model] = {};
					device.brand = device.brand || brand;
					device.model = device.model || model;

					if (!this._models[device.brand]) {
						this._models[device.brand] = {};
					}

					// merge with reference
					_m.merge(this._models[device.brand][device.model], _m.omit(device, 'brand,model,_ref') || {});

					// set reference
					if (device.brand !== brand) {
						this._models[brand][model].brand = device.brand;
					}
					if (device.model !== model) {
						this._models[brand][model].model = device.model;
					}
					if (! this._models[device.brand][device.model]) {
						this._models[device.brand][device.model] = _m.omit(device, 'brand,model,_ref');
					}
				}
				else if (device) {
					if (device.brand === brand) delete(device.brand);
					if (device.model === model) delete(device.model);
				}
			}
		}
	},
	/**
	 * loop and expand tree
	 */
	loop: function() {
		var brand,
			model,
			deviceModels = this._models;

		if (deviceModels) {
			for (brand in deviceModels) {
				// create reference with known device model
				for (model in deviceModels[brand]) {
					this._ref(brand, model);
				}
			}
		}
	},
	/**
	 * expand reference
	 */
	_ref: function (brand, model) {
		var
			device,
			tmpB = brand,
			tmpM = model,
			deviceModels = this._models;

		// max depth is 5
		for (var i=5; i>0; i--) {
			device = deviceModels[tmpB][tmpM] || {};

			// exit condition: brand and model do not change any more
			if (tmpB === device.brand &&
				tmpM === device.model
			){
				device = _m.clone(deviceModels[device.brand][device.model]) || {};
				deviceModels[brand][model] = device;
				return;
			}

			device.brand = device.brand || tmpB;
			device.model = device.model || tmpM;

			if (device.brand &&
				device.model &&
				deviceModels[device.brand] &&
				deviceModels[device.brand][device.model]
			){
				tmpB = device.brand;
				tmpM = device.model;
			}
		}
		throw new Error('Recursion Issue: "' + brand + '" "' + model + '"');
	},
	/**
	 * correct data by data.name
	 */
	createRefsByName: function(){
		var
			i,
			ref,
			tmp,
			brand,
			model,
			data,
			found = {};

		// collect
		for (brand in this._models) {
			for (model in this._models[brand]) {
				data = this._models[brand][model];
				if (data && data.name) {
					if (!found[data.name]) {
						found[data.name] = _m.extend({}, data);
					}
				}
			}
		}
//~ var __m = 'a107'
//~ var __b = 'Micromax'
//~ console.log(1, this._models[__b][__m])
//~ console.log(1, this._models['Generic_Android'][__m])
		// clean
		for (brand in this._models) {
			for (model in this._models[brand]) {
				data = this._models[brand][model];
//~ if(model === __m) console.log(2, ref, brand, model, tmp, data)
				if (data && data.name) {
					if ((tmp = found[data.name])) {
						ref = false;

						// check if properties differ
						'size,date,type'.split(',').forEach(function(p){
							if (data[p] && tmp[p] && data[p] !== tmp[p]) {
								console.error(p + ' differs for ' + brand + ' ' + model + ' ('+tmp[p] +' !== '+ data[p]+') ' + data.name );
							}
						});

						// create the reference
						if (tmp.brand !== brand) {
							ref = true;
							data = { brand: tmp.brand };
						}
						if (tmp.model !== model) {
							if (ref) {
								data.model = tmp.model;
							}
							else {
								ref = true;
								data = { model: tmp.model };
							}
						}
						if (!ref) {
							delete(data.brand);
							delete(data.model);
						}
					}
				}
				if (data.brand === brand) delete(data.brand);
				if (data.model === model) delete(data.model);
				if (data.brand !== undefined || data.model !== undefined) {
					//~ if (model === __m) console.log(4, data)
					data = _m.pick(data, 'brand,model');
					//~ if (model === __m) console.log(4, data)
				}
				this._models[brand][model] = data;
			}
		}
//~ console.log(3, this._models[__b][__m])
//~ console.log(3, this._models['Generic_Android'][__m])
	},
	/**
	 * ascending sorter
	 */
	sortAsc: function (a, b) {
		var cmp = a.toLowerCase().localeCompare(b.toLowerCase());
		if (cmp !== 0) {
			return cmp;
		}
		return (a > b) ? 1 : ( a < b ? -1 : 0);
	},
	/**
	 * sorts the _models
	 */
	sort: function() {
		this._models = hashTree.sort(this._models, this.sortAsc);
	},
	/**
	 * add a single model
	 */
	add: function(opts, cmd) {
		var brand,
			model,
			device,
			string;

		if (typeof opts === 'string') {
			string = opts;
			opts = {};
		}

		if (string) {
			device = uaParser.parseDevice(string);
		}
		else {
			device = { brand: opts.brand, model: opts.model };
		}
		if (device.brand && device.model && device.brand !== 'Generic') {
			// normalize
			device.brand = this.lowerBrand(device.brand);
			device.model = this.lowerModel(device.brand, device.model);

			if (!this._models[device.brand])
				this._models[device.brand] = {};
			if (!this._models[device.brand][device.model] )
				this._models[device.brand][device.model]  = {};

			if (cmd && cmd.replace) {
				this._models[device.brand][device.model] = opts || {};
			}
			else if (cmd && cmd.brand) {
				cmd.brand = this.lowerBrand(cmd.brand);
				_m.merge(this._models[cmd.brand][device.model], opts || {});
			}
			else {
				_m.merge(this._models[device.brand][device.model], opts || {});
			}
		}
	},
	/**
	 * delete a single model
	 */
	delete: function(device) {

		// normalize
		var brand = this.lowerBrand(device.brand),
			model = this.lowerModel(brand, device.model);

		if (_m.get(this._models,[brand, model])) {
			delete (this._models[brand][model]);
			return true;
		}
	},
	/**
	 *
	 */
	getType: function(string, type) {
		if(!type) {
			if (/Android\b.*Mobile Safari\//.test(string)) {
				return 'smartphone'
			}
			else if (/Android\b.* Safari\//.test(string)) {
				return 'tablet'
			}
		}
		return type;
	},
	/**
	 * generate a CSV file from a list of user agents
	 */
	generateCSV: function(useragentsfile) {
		var self = this,
			csv = [],
			cols = '_command,brand,model,type,size,name,display,date,debug,string'.split(','),
			brand,
			model,
			device,
			row,
			uas;

		if (useragentsfile) {
			uas = Models.static.uaFile.loadSync(useragentsfile);

			uas.forEach(function(userAgent){
				if (userAgent) {
					var device = uaParser.parseDevice(userAgent);
					device.string = userAgent;
					device.type = self.getType(device.string, device.type);
					var row = cols.map(function(col){
						return device[col] || '';
					});
					csv.push(row.join(CSVSEP));
				}
			});
		}
		else {
			this.load();
			this.refs();

			for (brand in this._models) {
				for (model in this._models[brand]) {
					device = this._models[brand][model];
					if (device && !device._ref) {
						device.brand = device.brand || brand;
						device.model = device.model || model;
						row = cols.map(function(col){
							return device[col] || '';
						});
						csv.push(row.join(CSVSEP));
					}
				}
			}
		}
		csv.sort(this.sortAsc);
		csv.unshift(cols.join(CSVSEP));

		fs.writeFileSync(this._filenameCsv, csv.join('\n'), 'utf8');
	},
	/**
	 * read a CSV file
	 */
	DISABLED__addCSV: function(filename) {
		var line = 0,
			fields = [];

		this.load();
		this.lower();

		function unescapeCsv(string) {
			var PATTERN = /^(")(.*)\1$/;
			if (PATTERN.test(string)) {
				return string
					.replace(PATTERN, '$2')
					.replace(/""/, '"');
			}
			return string;
		}

		fs.createReadStream(filename)
		.pipe(split({chomp: true, encoding: 'utf8'}))
		.pipe(through({encoding: 'utf8', decodeStrings: false},
			function transform(string){
				var i,
					obj = {},
					row = string.split(CSVSEP);

				if (line===0) {
					fields = row;
				}
				else {
					i = 0;
					fields.forEach(function(f) {
						obj[f] = unescapeCsv(row[i++]) || '';
					});
				}
				line++;

			}, function flush(){
				console.log(line);
			})
		);
	},
	/**
	 * TODO change to read from filename
	 */
	addModelsCSV: function(lines) {
		var tmp,
			self = this;
		var REQUOTE = /^(")(.*)(\1)$/;

		// csv file - get column headers
		var cols = lines[0].split(CSVSEP);
		if (~cols.indexOf('string')) {
			lines.shift();
		}
		else {
			cols = ['string'];
		}

		// process lines
		lines.forEach(function(line) {
			var row = line.split(CSVSEP).map(function(m){
				if (REQUOTE.test(m)) {
					return m.replace(REQUOTE, '$2').replace(/""/g, '"');
				}
				return m;
			});
			var opts = {};
			cols.forEach(function(c, i){
				if (! /^debug|string$/.test(c) && row[i]) {
					if (/^size$/.test(c)) {
						opts[c] = parseFloat(row[i], 10);
					}
					else if (/^display$/.test(c)) {
						opts[c] = row[i].replace(/\s/g, '').replace(/[^0-9]/, 'x');
					}
					else {
						opts[c] = row[i].trim();
					}
				}
			});

			if (opts._command) {
				var commands = (opts._command || '').split(/\s*,\s*/);

				opts = _m.omit(opts, '_command');

				commands.forEach(function(command){
					command.replace(/^(set|move|delete|replace)(?:\s+(.*))?$/i, function(m, cmd, brand) {
						var b, tmp;
						cmd = cmd.toLowerCase();

						switch(cmd) {
							case 'delete': {
								self.delete(opts);
								break;
							}
							case 'replace': {
								self.add(opts, {replace:true});
								break;
							}
							case 'move': {
								//~ console.log('#1',brand, opts)
								if (brand){
									b = self.lowerBrand(opts.brand);
									m = self.lowerModel(b, opts.model);
									tmp = _m.get(self._models, [b, m]);
									self.delete(opts);
									if (/^Generic_/.test(brand)) {
										// do not overwrite brand here
										tmp = _m.merge(tmp, opts);
									}
									else {
										tmp = _m.merge(tmp, opts, {brand: brand});
									}
									console.log('#2', brand, m, tmp);
									_m.set(self._models, [brand, m], tmp);
									opts = tmp;
								}
								break;
							}
							case 'set': {
								if (brand) {
									b = self.lowerBrand(opts.brand);
									m = self.lowerModel(b, opts.model);
									tmp = _m.get(self._models, [b,m]);
									tmp = _m.merge(tmp, opts, {brand: brand});
									_m.set(self._models, [b, m], tmp);
									opts = tmp;
								}
								break;
							}
						}

					});
				});
			}
			else {
				self.add(opts);
			}
		});
	},
	/**
	 * add new models from file
	 */
	addModels: function(useragentsfile) {
		var self = this;
		var uas = Models.static.uaFile.loadSync(useragentsfile);

		this.load();
		this.lower();

		// csv like tab separated file with headers at first line
		if (uas[0] && uas[0].split(CSVSEP).length > 1) {
			self.addModelsCSV(uas);
		}
		// only text file with list of useragents
		else {
			// only user-agents
			uas.forEach(function(ua) {
				self.add(ua);
			});
		}

		this.loop();
		this.createRefsByName();
		this.sort();
		this.save();
	},
	/**
	 * putting all together
	 */
	clean: function(){
		this.load();
		this.lower();
		this.loop();
		this.createRefsByName();
		this.sort();
		this.save();
	},
};

module.exports = Models;
