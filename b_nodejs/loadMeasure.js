#!/usr/bin/env node

const sophia_wasm = require('@bruju/sophia_wasm');
const wasm_tree = require('@bruju/wasm-tree');
const n3 = require("n3");
const graphy_dataset = require("@graphy/memory.dataset.fast")

const datasetInstancier = {
    "tree"      : () => new sophia_wasm.TreedDataset(),
    "wasm_tree" : () => new wasm_tree.Dataset(),
    "graphy"    : () => graphy_dataset(),
    "n3"        : () => new n3.Store()
};

const { taskValidator, datasetValidator, stream, get_vmsize, performance } = require("./common.js")

let parser = new n3.Parser({ format: "N-Triples" });

let dataset = datasetInstancier[process.argv[4]];

if (dataset === undefined) {
    console.error("Unknown dataset " + process.argv[4]);
    process.exit(7);
}

const mem0 = get_vmsize();

dataset = dataset();

if (task == "all_indexes") {
    for (let s of [null, n3.DataFactory.blankNode("None")]) {
        for (let p of [null, n3.DataFactory.blankNode("None")]) {
            for (let o of [null, n3.DataFactory.blankNode("None")]) {
                for (let g of [null, n3.DataFactory.blankNode("None")]) {
                    if (dataset.ensureHasIndexFor !== undefined) {
                        function x(a) { return a ? true : false; }
                        dataset.ensureHasIndexFor(x(s), x(p), x(o), x(g));
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

if (dataset.get_nb_underlying != undefined) {
    console.error(dataset.get_nb_underlying() + " trees");
}


// n3 is not a RDF.JS dataset but its addQuad is similar to the RDF.JS add
// function.
if (dataset.add === undefined) {
    dataset.add = dataset.addQuad;
}

const start_load = performance.now();

parser.parse(stream, (error, quad, _) => {
    if (error) {
        console.error(error);
        process.exit(2);
    }

    if (quad) {
        dataset.add(quad);
    } else {
        // End
        const duration_load = (performance.now() - start_load) / 1000;

        const mem1 = get_vmsize();
        let m_graph = mem1-mem0;

        console.log(`${dataset.size},${m_graph},${duration_load}`);
    }
});
