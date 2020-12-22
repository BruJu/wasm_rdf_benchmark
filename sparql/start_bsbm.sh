#!/bin/bash
set -e

cd bsbmtools-0.2/
java -cp .:lib/bsbm.jar:lib/jdom.jar:lib/log4j-1.2.12.jar:lib/ssj.jar -Xmx256M benchmark.testdriver.TestDriver http://localhost:3000/sparql -w 1 -runs 5
