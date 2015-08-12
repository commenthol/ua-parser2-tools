#!/usr/bin/env node

/**
 * @license MIT
 * @copyright 2015 commenthol
 */

'use strict';

var
	path     = require('path'),
	cmd      = require('commander'),
	config   = require('../config'),
	uaParser = require('ua-parser2')(config.parser);

var models = require('../lib/models')();

function main() {
	var
		filename,
		cwd = process.cwd();

	/// the program
	cmd
		.option('-o, --out <file>',        'output regenerated tests file <file>')
		.option('-i, --in <file>',         'input tests file <file>')
		.option('-u, --useragents <file>', 'Add User-Agents from <file>')
		.option('--csv', 'generate csv file')
		.option('-c, --console',           'output details to console')
		.option('-d, --debug',             'add debug info if present')
		.parse(process.argv);

	console.log();

	if (cmd.in) {
		models._filename = path.resolve(cwd, cmd.in);
		if (cmd.useragents) {
			// reload file into uaparser
			uaParser.loadSync({ models: models.filename });
		}
	}
	if (cmd.out) {
		models._filenameOut = path.resolve(cwd, cmd.out);
	}
	if (cmd.useragents) {
		filename = path.resolve(cwd, cmd.useragents);
		if (cmd.csv) {
			models.generateCSV(filename);
		}
		else {
			models.addModels(filename);
		}
	}
	else {
		if (cmd.csv) {
			models.generateCSV();
		}
		models.clean();
	}

}

if (require.main === module) {

	// TODO - remove
	if(false) {
		[	'-u', path.join(config.rules.dir, 'models.csv'),
			//~ '-o', __dirname + '/../../out.yaml'
		].forEach(function(i){
			process.argv.push(i);
		});
	}

	main();
}