/*!
 * capabilities tree object
 * 
 * Copyright (c) 2013 Commenthol 
 * Released under the MIT license
 */

"use strict";

var sorter = require('./sorter.js'),
	HashSort = require('./hashsort.js'),
	_        = require('lodash');

module.exports = Tree;

/**
 * constructor
 */
function Tree (tree) {
	
	this._base = { 
		info: {},
		os: { 
			family: {} 
		},
		ua: { 
			family: {} 
		},
		device: { 
			family: {}, 
			brand: {} 
		}
	};
	
	if (tree && ( tree.os || tree.ua || tree.device )) {
		this._base = _.assign(this._base, tree);
	}
	
	this._size = 0;
};

/**
 * sort the tree
 */
Tree.prototype.sort = function (array) {

	array = array || ['info', 'default', 'os', 'ua', 'device', 'family', 'brand'];
	
	var hsort = new HashSort(sorter.arrayValueSorter(array, { lowerCase: true }));
	var result = hsort.sort(this._base);
		
	return result;
};

/**
 * add a parsed item
 * @param {Object} item - ua-parser parsed object
 * @param {Object} capabilities 
 */
Tree.prototype.add = function (item, capabilities){
	
	this._size += 1;
	this._create(item, 'os', ['family', 'major', 'minor'], capabilities);
	this._create(item, 'ua', ['family', 'major', 'minor'], capabilities);
	this._createDevice(item, ['brand', 'model'], capabilities);
};

/**
 * set default
 */
Tree.prototype.addDefault = function (capabilities) {
	
	if (! this._base.default) {
		this._base.default = {};
	}
	this._base.default = _.merge(this._base.default, { capabilities: capabilities });
}

/**
 * get the number of added items
 */
Tree.prototype.size = function () {
	
	return this._size;
}

/**
 * obtain the build up tree
 */
Tree.prototype.obtain = function (sort) {
	
	sort = sort || true;
	
	if (sort) {
		this._base = this.sort();
	}
	this._base.info.processed_user_agents = this._size;
	return this._base;
}

/**
 * create a leaf in the tree for os and ua
 * 
 * @param {Object} item : ua-parser parsed item
 * @param {String} type : os|ua 
 * @param {Array} attrs : attributes to append to the tree
 * @api private
 */
Tree.prototype._create = function (item, type, attrs, capabilities) {
	
	var i,
			obj = this._base[type];
	
	if (item[type]) {
		
		for (i = 0; i < attrs.length ; i += 1) {
			var attr = attrs[i],
					val = item[type][attr];
				 
			if (! val) {
				if (attr === 'brand') {
					val = '';
				}
				else {
					break;
				}
			}
			
			if (! obj) {
				obj = {};
			}
			if (! obj[attr]) {
				obj[attr] = {};
			}
			if (! obj[attr][val]) {
				obj[attr][val] = {};
			}
			
			obj = obj[attr][val];
		}
		
		if (capabilities && capabilities[type]) {
			obj = _.merge(obj, { capabilities: capabilities[type] });
		}
		else {
			obj = null;
		}
	}
};


/**
 * create a leaf in the tree for device
 * 
 * @param {Object} item : ua-parser parsed item
 * @param {Array} attrs : attributes to append to the tree
 * @api private
 */
Tree.prototype._createDevice = function (item, attrs, capabilities) {
    
	var type = 'device',
			obj = this._base[type],
			family,
			brand,
			model;
	
	if (item.device) {
		family = item.device.family || '';
		brand  = item.device.brand || '';
		model  = item.device.model || '';
		
		family = trim(family);
		brand  = trim(brand);
		model  = trim(model);
		
		if (family !== '' && model !== '' && 
				family.indexOf(brand) === -1 && 
				family.indexOf(model) === -1) {
					
			this._create(item, type, ['family']);
		}
		
		if (brand !== '' && model !== '') {
			this._create(item, type, attrs, capabilities);
		}
	}

};


function trim(str) {
	
	str = str.toLowerCase().replace(/[^a-z0-9]/, '');

	return str;
}

