#!/usr/bin/env node
"use strict"

const n3 = require("n3");
const graphy_dataset = require("@graphy/memory.dataset.fast")
const sophia_wasm = require('@bruju/sophia_wasm')
const sophia_wasm_ = require('@bruju/sophia_wasm/wrapper.js')
const wasm_tree = require('@bruju/wasm-tree');

const { taskValidator, datasetValidator, patternToTerms, stream, get_vmsize, performance } = require("./common.js")

const pattern = taskValidator(["S", "SG", "PO", "POG"]);

const datasetInstancier = {
    // Standard Sophia Datasets
    "fast"        : () => new sophia_wasm.FastDataset(),
    "wrap_fast"   : () => new sophia_wasm_.SophiaDatasetWrapper(new sophia_wasm.FastDataset()),
    "light"       : () => new sophia_wasm.LightDataset(),
    "array"       : () => new sophia_wasm.ArrayDataset(),
    "fast_array"  : () => new sophia_wasm.FastDatasetToA(),
    "tree_array"  : () => new sophia_wasm.TreeDatasetToA(),
    "full_array"  : () => new sophia_wasm.FullDatasetToA(),
    // FullIndexDataset
    "full"        : () => new sophia_wasm.FullDataset(),
    // TreeDataset
    "tree"        : () => new sophia_wasm.TreeDataset(),
    "tree_anti"   : () => new sophia_wasm.AntiTreeDataset(),
    "wrap_tree"   : () => new sophia_wasm_.SophiaDatasetWrapper(new sophia_wasm.TreeDataset()),
    // WasmTree
    "wasm_tree"   : () => new wasm_tree.Dataset(),
    "wasm_tree_FI": () => new wasm_tree.AlwaysForestDataset(),              // always Forest  , Independant mapping
    "wasm_tree_FS": () => new wasm_tree.DatasetWithSharedTermIdMap(),       // always Forest  , Shared mappipng
    "wasm_tree_II": () => new wasm_tree.DatasetWithIdentifierList(),        // Identifier list, Independant mapping
    // Graphy
    "graphy"      : () => graphy_dataset()
};


let datasetMaker = datasetValidator(datasetInstancier);

function run_benchmark() {
    let parser = new n3.Parser({ format: "N-Triples" });
    const mem0 = get_vmsize();
    let start = performance.now();

    let dataset = datasetMaker();    

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

            let isIterable = dataset[Symbol.iterator] !== undefined;

            const argsForMatch = patternToTerms(pattern);
            console.error(argsForMatch);

            let bench = function() {
                let start = performance.now();
                let filtered_dataset = dataset.match(argsForMatch[0], argsForMatch[1], argsForMatch[2], argsForMatch[3]);

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

                duration = performance.now() - start;
                let t_first = duration/1000;

                start = performance.now();

                let counter = 0;
                for (let _quad of loopOn) {
                    counter += 1;
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

run_benchmark();
