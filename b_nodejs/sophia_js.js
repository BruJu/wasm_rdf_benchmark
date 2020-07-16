#!/usr/bin/env node
"use strict"

// We use n3 parser to be fair between every implementation
const n3 = require("n3");
// https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly
const sophia_js = require('../../wasmify_sophia/sophia-wasm/pkg/sophia_wasm.js');
const sophia_js_wrapped = require('../../wasmify_sophia/sophia-wasm/pkg/wrapper.js');
// https://github.com/BruJu/WasmTreeDataset
const wasm_tree = require('../../WasmTreeDataset/wasm-tree-frontend');
// Graphy
const graphy_dataset = require("@graphy/memory.dataset.fast")

const { task, _, stream, get_vmsize, performance } = require("./common.js")

// Run the required task
const do_task = {
    'query': () => query_nt(1),
    'query2': () => query_nt(2),
    'query3': () => query_nt(3),
    'query4': () => query_nt(4)
}[task];


const datasetInstancier = {
    "fast"      : () => new sophia_js.FastDataset(),
    "light"     : () => new sophia_js.LightDataset(),
    "tree"      : () => new sophia_js.TreedDataset(),
    "tree_anti" : () => new sophia_js.AntiTreedDataset(),
    "full"      : () => new sophia_js.FullDataset(),
    "array"     : () => new sophia_js.ArrayDataset(),
    "fast_array": () => new sophia_js.FastDatasetToA(),
    "tree_array": () => new sophia_js.TreedDatasetToA(),
    "full_array": () => new sophia_js.FullDatasetToA(),
    "wrap_tree" : () => new sophia_js_wrapped.SophiaDatasetWrapper(new sophia_js.FastDataset()),
    "wasm_tree" : () => new wasm_tree.Dataset(),
    "graphy"    : () => graphy_dataset()
};

do_task();

const LOOP_TO_COUNT = true;

function query_nt(query_num) {
    let parser = new n3.Parser({ format: "N-Triples" });
    const mem0 = get_vmsize();
    let start = performance.now();

    let dataset = datasetInstancier[process.argv[4]];

    if (dataset === undefined) {
        console.error("Unknown dataset " + process.argv[4]);
        process.exit(7);
    }

    dataset = dataset();

    let isIterable = dataset[Symbol.iterator] !== undefined;

    parser.parse(stream, (error, quad, _) => {
        if (error) {
            console.error(error);
            process.exit(2);
        }

        if (quad) {
            dataset.add(quad);
        } else {
            let duration = performance.now() - start;
            const mem1 = get_vmsize();
            let t_load = duration/1000;
            let m_graph = mem1-mem0

            let subject, predicate, object, graph;
            if (query_num == 1 || query_num == 3) {
                subject = undefined;
                predicate = n3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
                object = n3.DataFactory.namedNode('http://dbpedia.org/ontology/Person');
            } else if (query_num == 2 || query_num == 4) {
                subject = n3.DataFactory.namedNode('http://dbpedia.org/resource/Vincent_Descombes_Sevoie');
                predicate = undefined;
                object = undefined;
            }

            if (query_num <= 2) {
                graph = n3.DataFactory.defaultGraph();
            } else {
                graph = undefined;
            }

            let bench = function() {
                let start = performance.now();
                let filtered_dataset = dataset.match(subject, predicate, object, graph);

                duration = performance.now() - start;
                let t_first = duration/1000;

                let loopOn;
                if (isIterable) {
                    loopOn = filtered_dataset;
                } else {
                    loopOn = {
                        base: filtered_dataset,
                        [Symbol.iterator]() {
                            return this.base.getIterator();
                        }
                    };
                }

                start = performance.now();

                let counter = 0;
                if (LOOP_TO_COUNT) {
                    for (let _quad of loopOn) {
                        counter += 1;
                    }
                } else {
                    counter = filtered_dataset.size;
                }

                duration = performance.now() - start;
                let t_last = duration/1000;

                if (filtered_dataset.free !== undefined) {
                    filtered_dataset.free();
                }

                return [t_first, t_last, counter];
            }
            
            let firstData = bench();
            let secondData = bench();
            // console.error(sophia_js.__wasm.memory.buffer);
            const mem2 = get_vmsize() - mem0;

            if (dataset.free !== undefined) {
                dataset.free();
            }

            console.error(`retrieved: ${secondData[2]}`);
            console.log(`${t_load},${m_graph},${mem2},${firstData[0]},${firstData[1]},${secondData[0]},${secondData[1]}`);
            process.exit(0);
        }
    });
}

