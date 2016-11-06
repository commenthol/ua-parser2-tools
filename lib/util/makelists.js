"use strict";

var
  fs         = require('fs'),
  path       = require('path'),
  extend     = require('./extend').extend,
  fileSync   = require('./filesync'),
  reportData = require('./report').reportData,
  decode     = require('./decode.js').decode;

/**
 */
function notNoFile(filename) {
  return ! /(^|.*\/)no$/.test(filename);
}

function toVersionString(ua) {
  var output = '';
  if (ua.major != null) {
    output += ua.major;
    if (ua.minor != null) {
      output += '.' + ua.minor;
      if (ua.patch != null) {
        output += '.' + ua.patch;
        if (ua.patchMinor != null) {
          output += '.' + ua.patchMinor;
        }
      }
    }
  }
  return output;
}

/**
 * parse user agents and generate reports, testcases
 * @param    {Object} config
 * @property {Array}  config.attr        - attributes contained in parsed object
 * @property {Object} config.parser      - parser used to extract attributes from user-agent-string
 * @property {String} config.testcasesfile - filename of testcases file to load
 *
 * @param    {Object}  options
 * @property {Boolean} options.console   - true: print out information while calling add()
 * @property {Boolean} options.family    - false: do not add family field
 * @property {Boolean} options.debug     - false: do not add debug field
 * @property {Boolean} options.swapdebug - if debug == true then debug info is printed in the swapdebug field
 * @property {Boolean} options.other     - true: add also unmatched user-agents to testcases
 * @property {Boolean} options.appenduas - true: append user-agents from test-cases to check for broken tests
 * @property {Array}   options.fields    - fields used to add data 
 * @property {Array}   options.fieldsBroken - fields used to add data to broken report
 */
function makeLists(config, options) {
  var
    user_agents,
    new_tests    = [],
    broken_tests = [],
    testcase_map = {},
    testcases,
    str,
    attr          = config.attr || [],
    report        = reportData(options),
    report_broken = reportData({ fields: options.fieldsBroken });

  if (options.file && notNoFile(options.file)) {
    if (/^[^\.\/]/.test(options.file)) {
      options.file = path.normalize(path.join( __dirname, '..', options.file));
    }
    console.log('... reading user-agents from ' + options.file);
    try {
      user_agents = fileSync.readUserAgentsListSync(options.file);
    } 
    catch(e) {
      console.log('ERROR: no user-agents found in file ' + options.file);
    }
  }

  if (! user_agents) {
    user_agents  = [];
  }

  if (options.testcases) {
    if (notNoFile(options.testcasesfile)) {
      console.log('... reading testcases from ' + config.testcasesfile);
      testcases = fileSync.readSync(config.testcasesfile);
      if (! testcases ) {
        console.log('ERROR: no testcases found in file ' + config.testcasesfile);
      }
    }
    if (! testcases ) {
      testcases = { test_cases: [] };
    }

    // delete doubled testcases first
    testcase_map = {};
    testcases.test_cases = testcases.test_cases.filter(function(p) {
      if (testcase_map[p.user_agent_string] === 1) {
        console.log('... deleting doubled testcase for: ' + p.user_agent_string);
        return false;
      } 
      else {
        testcase_map[p.user_agent_string] = 1;
        return true;
      }
    });

    if (options.appenduas) {
      console.log('... appending user-agents from test cases');
    }

    testcase_map = {};
    // convert testcases into a hash for faster lookup
    testcases.test_cases.forEach(function(p, index) {
      p.user_agent_string = decode(p.user_agent_string); // decode url encoded uas
      
      if (options.appenduas) {
        user_agents.push(p.user_agent_string);
      }
      testcase_map[p.user_agent_string] = { index: index };
      attr.map(function(pp){
        testcase_map[p.user_agent_string][pp] = p[pp];
      });
    });
  }
  
  console.log('... ' + user_agents.length + ' user-agents found ... parsing user-agents');
  
  // loop over all strings given in the user-agents file
  user_agents.forEach(function(ua_string) {
    var
      str,
      tmp,
      isBroken,
      ua = config.parser(ua_string);

    // adjust camel cases..
    ua.patch_minor = ua.patchMinor || null;

    if (options.testcases) {
      // check if testcase is broken
      tmp = testcase_map[ua_string];
      if (tmp) {
        isBroken = false;
        attr.map(function(p){
          if (ua[p] !== tmp[p]) {
            isBroken = true;
          }
        });
        if (isBroken) {
          console.log('Error: broken testcase ' + ua_string);

          var broken = {};
          options.fieldsBroken.map(function(p){
            if (/^debug$/.test(p)) {
              broken.debug = ua.debug;
            }
            else if (/^family/.test(p)) {
              broken.family_was = tmp.family;
              broken.family_is  = ua.family;
            }
            else if (/^version/.test(p)) {
              broken.version_was = toVersionString(tmp);
              broken.version_is  = toVersionString(ua);
            }
            else if (/^brand/.test(p)) {
              broken.brand_was = tmp.brand;
              broken.brand_is  = ua.brand;
            }
            else if (/^model/.test(p)) {
              broken.model_was = tmp.model;
              broken.model_is  = ua.model;
            }
          });
          report_broken.add(ua_string, broken);

          // memorize broken user-agent
          broken_tests.push(extend(ua, { index: tmp.index }));
        }
      }
      else {
        ua.user_agent_string = ua_string;
        // add new test case
        new_tests.push(ua);
      }
    }
    report.add(ua_string, ua);
  });

  // change broken test cases
  broken_tests.forEach(function(p){
    var obj = testcases.test_cases[p.index];
    attr.map(function(pp){
      obj[pp] = p[pp];
    });
    testcases.test_cases[p.index] = obj;
  });

  // add new test cases
  new_tests.forEach(function(p){

    // create the right object structure (user_agent_string needs to be first)
    var obj = { user_agent_string: p.user_agent_string };
    attr.map(function(pp){
      obj[pp] = p[pp];
    });

    // control adding test cases without any match
    if (options.other || p.family !== 'Other') {
      testcases.test_cases.push(obj);
    }
  });

  console.log('... ' + report.length() + ' user-agents processed');
  // write reports
  console.log('... writing list ' + options.listfile);
  fileSync.createDirsSync(options.listfile);
  fs.writeFileSync(options.listfile, report.show(), 'utf8');

  if (options.testcases) {
    if (report_broken.length() > 0) {
      console.log('... '+ report_broken.length() +' number of broken testcases: ');
      console.log('... writing broken tests log file ' + options.logfile);
      fs.writeFileSync(options.logfile, report_broken.show(), 'utf8');
    }
    else {
      fs.exists(options.logfile, function(exists) {
        if (exists) {
          fs.unlinkSync(options.logfile);
        }
      });
    }
    // write test cases
    console.log('... '+ testcases.test_cases.length +' number of testcases' );
    console.log('... writing testcases file ' + options.testcasesout);
    fileSync.writeSync(options.testcasesout, testcases);
  }
}

module.exports = makeLists;
