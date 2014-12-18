#!/bin/bash

# creates a ramdisk

DIR="$(cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
cd $DIR/..

MNTDIR=./report

sudo mount -t ramfs ramfs $MNTDIR
sudo chown $USER:$USER report $MNTDIR
