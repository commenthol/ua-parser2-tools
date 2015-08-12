'use strict';

var M = {
	/**
	 * properties to select
	 */
	props: ['family', 'major', 'minor', 'patch', 'patchMinor', 'brand', 'model', 'type', 'size', 'name', 'debug'],

	/**
	 * Pick properties from all parsing results
	 * @param {Object} ua - UAParser object
	 * @return {Object} compacted UAParser object
	 */
	pick: function(ua) {
		var
			obj,
			tmp,
			p;

		if (ua) {
			for (p in ua) {
				if (p === 'string') {
					if (!obj) obj = {};
					obj[p] = ua[p];
				}
				else {
					tmp = M.pickOne(ua[p]);
					if (tmp) {
						if (!obj) obj = {};
						obj[p] = tmp;
					}
				}
			}
		}
		return obj;
	},

	/**
	 * Pick properties from one parsing result
	 * @param {Object} ua - single UAParser parsing result object
	 * @return {Object} compacted object
	 */
	pickOne: function(ua){
		var	obj;

		if (ua && ua.family !== 'Other') {
			if (!obj) obj = {};
			M.props.forEach(function(p){
				if (ua && ua[p] != null) {
					obj[p] = ua[p];
				}
			});
		}
		return obj;
	}
};

module.exports = M;

