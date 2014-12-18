<!-- !numberedheadings (minlevel=2 omit="Table of Contents") -->

# ua-parser-tools

> Development Tools for ua-parser2

This project contains development tools which may help to add new regular expressions to the `regexes.yaml` file of the [ua-parser2](https://github.com/commenthol/ua-parser2) Project.

From a file containing user-agent strings sorted csv-tables for the different parsers can be generated.
With the csv-tables the parsing results for the given user-agent strings can be compared.

To detect the matching parsing line in the `regexes.yaml`, debug information can be added to the file.

## Table of Contents

<!-- !toc (minlevel=2 omit="Table of Contents") -->

* [1\. General Files](#1-general-files)
* [2\. Files to generate lists and add test cases](#2-files-to-generate-lists-and-add-test-cases)
* [3\. Installation](#3-installation)
* [4\. Development Process](#4-development-process)
* [5\. License](#5-license)

<!-- toc! -->

## 1\. General Files

* `bin/debuginfo.js`<br>
  Add or remove debug information to the `regexes.yaml` file. Run the file with `bin/debuginfo.js`.
  Please *remove* the debug infomation before commiting the changed `regexes.yaml` file.

* `useragents.txt`<br>
  (Sample-file) List of user-agents which are used as input. Each line shall contain one user-agent string.

* `config.js`<br>
  Configuration settings to locate the `test_resources` and the `regexes.yaml` file. 


## 2\. Files to generate lists and add test cases

* `bin/ua.js`
  Parse the user-agents with the ua-parser.

* `bin/engine.js`
  Parse the user-agents with the engine-parser.

* `bin/os.js`
  Parse the user-agents with the os-parser.

* `bin/device.js`
  Parse the user-agents with the device-parser.

* `bin/all.js`
  Parse the user-agents with the all parsers.

All files can be used with the following arguments:

```
    -h, --help               output usage information
    -u, --useragents [file]  Read User-Agents from [file]
    -t, --tests [file]       Read tests from [file] (.json, .yaml)
    -o, --outdir <path>      Write all output to <path>
    -c, --console            Output to console
    -s, --swap               swap debug field in .csv output
    -n, --noappend           do not append parsed User-Agents to output tests file
```

## 3\. Installation

```bash
git clone https://github.com/commenthol/ua-parser2-tools.git
npm install
```

## 4\. Development Process

As an example the development process to add and change regular expressions
is depicted with adding new devices to the "device_parsers". For any other
parser you can follow the same steps with replacing `device.js` by either
`os.js` or `ua.js` .


1. Clone (or fork) the `ua-parser2` project within this directory.

   ````
   git clone https://github.com/commenthol/ua-parser2.git
   ````

   **Note:** If you have forked `ua-parser2` into a different dir adapt the setting `config.ua_parser.dir` in `config.js` accordingly. - TAKE CARE in STEP 12 !

2. Add the debug information to the `regexes.yaml` file. For each
   "regex" a debug info in the form "#0001" will be added and counted up.

   ````
   bin/debuginfo.js
   ````

3. Add your user-agents to the file `useragents.txt`.

4. Parse the user-agents with the parser you like to change.
   E.g. here "device_parsers"

   ````
   bin/device.js -u useragents.txt
   ````

5. Open the csv-output file in a spreadsheet or with

   ````
   less -Six12 report/device.csv
   ````

6. Check the csv-table if the user-agents were parsed the way they should.
   In the first column the debug number will be displayed. If this is
   missing either no match was found (default should be "Other") or the
   debug information is missing in the `regexes.yaml`.

7. Change one or more "regex" expressions in the `regexes.yaml` file.
   Parse the user-agents as in Step 4.

8. Recheck list again. To get a different view by changing the sorting
   order with family or brand model first, use:

   ````
   bin/device.js -s
   ````

9. If everything is as expected then re-run parsing with involving the
   testcases

   ````
   bin/device.js -t
   ````

10. This run writes the file `report/device-tests.json` and maybe
    `report/device-failed.csv`. In `device-failed.csv` all broken tests are reported.

11. If you are really sure that your changes do not corrupt the previous
    testcases and contain the right changes or corrections, remove the
    debuginfo from the `regexes.yaml` file with:

    ````
    bin/debuginfo.js
    ````

12. Then add your useragents to the testcases of `ua-parser2`

    ```
    ua-parser2/js/tool/add.js -u useragents.txt
    ```

    Re-run/ Re-generate the tests with ua-parser2 (failing tests are shown on the console)

    ```
    ua-parser2/js/tool/regen.js -c
    ```

    Copy the new-tests to the existing ones

    ```
    cd ua-parser2
    cp test_resources/new-tests.json test_resources/tests.json
    ```

    Now run all the tests...

    ````
    npm test
    ````

13. If these tests did run without any problems then commit your changes
    and issue a pull-request.

## 5\. License

Copyright (c) 2014- commenthol 

Software is released under [MIT][license].

[license]: ./LICENSE

