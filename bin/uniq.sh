#!/bin/bash

DIR="$(cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"

UNIQ="$DIR/uniq.js"
SORT="$DIR/sort.js"
DEVICE="$DIR/device.js"
UA="$DIR/ua.js"
OS="$DIR/os.js"
ENGINE="$DIR/engine.js"

echo "    do not forget to set debuginfo !"

#~ $DEVICE -u "$1" -c | awk 'BEGIN{FS="\t"};{print $5}' | $SORT | $UNIQ -c -t device $2
#~ $DEVICE -u "$1" -c | awk 'BEGIN{FS="\t"};{print $5}' | $SORT | $UNIQ -c -t device $2 | awk 'BEGIN{FS="\t"};{print $4}'

#~ $UA -t -c | awk 'BEGIN{FS="\t"};{print $5}'

uniqtestset() {
	echo "    ... device"
	$DEVICE -t -c | awk 'BEGIN{FS="\t"};{print $5}' | $SORT | $UNIQ -c -t device | awk 'BEGIN{FS="\t"};{print $4}' > testdev.u
	echo "    ... ua"
	$UA -t -c     | awk 'BEGIN{FS="\t"};{print $5}' | $SORT | $UNIQ -c -t ua  | awk 'BEGIN{FS="\t"};{print $6}' > testua.u
	echo "    ... os"
	$OS -t -c     | awk 'BEGIN{FS="\t"};{print $5}' | $SORT | $UNIQ -c -t os | awk 'BEGIN{FS="\t"};{print $6}' > testos.u
	echo "    ... engine"
	$ENGINE -t -c | awk 'BEGIN{FS="\t"};{print $5}' | $SORT | $UNIQ -c -t engine | awk 'BEGIN{FS="\t"};{print $6}' >testeng.u
}

uniqtestset