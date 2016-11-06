#!/bin/bash

./bin/device.js -u "$1" -c | awk 'BEGIN{FS="\t"};{print $5}' | bin/sort.js | bin/uniq.js -c -t device $2