#!/usr/bin/env node


// https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly
const sophia_js = require('../../wasmify_sophia/sophia-wasm/pkg/sophia_wasm.js');
// https://github.com/BruJu/WasmTreeDataset
const wasm_tree = require('../../WasmTreeDataset/wasm-tree-frontend');

const n3 = require("n3");
const graphy_dataset = require("@graphy/memory.dataset.fast")


const datasetInstancier = {
    "tree"      : () => new sophia_js.TreedDataset(),
    "wasm_tree" : () => new wasm_tree.Dataset(),
    "graphy"    : () => graphy_dataset(),
    "n3"        : () => new n3.Store()
};

const { task, _, stream, get_vmsize, _2 } = require("./common.js")

let parser = new n3.Parser({ format: "N-Triples" });

let dataset = datasetInstancier[process.argv[4]];

if (dataset === undefined) {
    console.error("Unknown dataset " + process.argv[4]);
    process.exit(7);
}

const mem0 = get_vmsize();

dataset = dataset();

parser.parse(stream, (error, quad, _) => {
    if (error) {
        console.error(error);
        process.exit(2);
    }

    if (quad) {
        if (dataset.add !== undefined)
            dataset.add(quad);
        else
            dataset.addQuad(quad);
    } else {
        if (task == "query") {
            for (let s of [null, n3.DataFactory.blankNode("None")]) {
                for (let p of [null, n3.DataFactory.blankNode("None")]) {
                    for (let o of [null, n3.DataFactory.blankNode("None")]) {
                        for (let g of [null, n3.DataFactory.blankNode("None")]) {
                            if (dataset.ensureHasIndexFor !== undefined) {
                                dataset.ensureHasIndexFor(s, p, o, g);
                            } else {
                                let match = dataset.match(s, p, o, g);
                                if (match.free !== undefined)
                                    match.free();
                            }
                        }
                    }
                }
            }
        }

        const mem1 = get_vmsize();
        let m_graph = mem1-mem0;

        console.log(`${m_graph}`);

        if (dataset.numberOfUnderlyingTrees !== undefined) {
            //console.log(dataset);
            console.log(dataset.numberOfUnderlyingTrees() + " tree(s)");
        }
    }
});
