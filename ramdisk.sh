#!/bin/bash

# creates a ramdisk

dir=./report
sudo mount -t ramfs ramfs $dir
sudo chown $USER:$USER report $dir
