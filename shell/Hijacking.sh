#!/bin/sh


### rebuild hijacking.list
### add ,REJECT to DOMAIN

DIR=$(pwd)
SRC=$(pwd)/../Filter/hijacking.list
TMP=$(mktemp)
sed 's/^\(DOMAIN.*\)$/\1,REJECT/' $SRC  > $TMP
cat $TMP > $SRC

rm -f $TMP

git add $SRC
git commit -m "sync Hijacking"