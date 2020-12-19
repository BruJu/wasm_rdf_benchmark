#!/usr/bin/env node

const wasm_tree = require('@bruju/wasm-tree');
const n3 = require("n3");
const ttl_read = require('@graphy/content.ttl.read');

const { taskValidator, datasetValidator, patternToTerms, stream, get_vmsize, performance } = require("./common.js")

const pattern = taskValidator(["S", "SG", "PO", "POG"]);
const storeMaker = datasetValidator({
    "n3"       : () => new n3.Store(),
    "wasm_tree": () => new wasm_tree.Store()
}, "store");

let bench = function(store, request, callback) {
    const start = performance.now();
    let t_first = 100000;

    let counter = 0;

    store.match(request[0], request[1], request[2], request[3])
        .on('data', (_) => {
            if (counter == 0) {
                let duration = performance.now() - start;
                t_first = duration / 1000;
                isFirst = false;
            }

            counter += 1;
        })
        .on('end', () => {
            let duration = performance.now() - start;
            let t_last = duration/1000;

            callback([t_first, t_last, counter]);
        });
}

function run_benchmark() {
    let store = storeMaker();
    let streamOfQuads = stream.pipe(ttl_read());

    const mem0 = get_vmsize();
    let start = performance.now();

    store.import(streamOfQuads)
        .on('end', () => {
            const duration = performance.now() - start;
            const mem1 = get_vmsize();
            const t_load = duration / 1000;
            const m_graph = mem1-mem0;
            const queryTerms = patternToTerms(pattern);

            // It is badly indented to keep a sense of sequential code as from this point everything is a callback
            bench(store, queryTerms, firstData => {
            bench(store, queryTerms, secondData => {
            console.error(`retrieved: ${secondData[2]}`);
            console.log(`${t_load},${m_graph},0,${firstData[0]},${firstData[1]},${secondData[0]},${secondData[1]}`);
            process.exit(0);
            }); });
        })
        .on('error', error => {
            console.error(error);
            process.exit(2);

        });
}

run_benchmark();
