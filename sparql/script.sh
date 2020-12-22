#!/bin/bash
set -e

unzip bsbmtools-v0.2.zip

# Get Wasm Tree Store
wget https://github.com/BruJu/WasmTreeDataset/releases/download/v0.2.0/bruju-wasm-tree-0.2.0.tgz
tar -xzf bruju-wasm-tree-0.2.0.tgz
mv package wasm_tree

cd wasm_tree
npm install
cd ..
# Get comunica
git clone https://github.com/comunica/comunica.git
cd comunica
git checkout v1.13.1
cd ..


mkdir comunica-untouched
cp comunica comunica-untouched/ -r
mkdir comunica-wasm
cp comunica comunica-wasm/ -r

# Modify Comunica-wasm
cd comunica-wasm/comunica/
yarn install
npm run-script build

# Substites every storeStream call to calls to wasm tree storeStream's function
find . -type f -exec sed -i 's/.*const rdf_store_stream_1 = require(\"rdf-store-stream\");.*/const rdf_store_stream_1 = require("..\/..\/..\/..\/..\/wasm_tree\/index.js")/' {} \;
cd ../../

# Build Comunica
cd comunica-untouched/comunica/
yarn install
npm run-script build
cd ../../

# Build Oxigraph Sparql Endpoint (Oxipoint)
cd oxigraph
npm install
cd ..

# Prepare BSBM
cd bsbmtools-0.2
java -cp .:lib/bsbm.jar:lib/jdom.jar:lib/log4j-1.2.12.jar:lib/ssj.jar -Xmx256M benchmark.generator.Generator -fc -pc 2000 -s ttl
echo 9 > queries/explore/ignoreQueries.txt
cd ..
