#!/usr/bin/env node

// We use n3 parser to be fair between every implementation
const n3 = require("n3");
// https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly
const sophia_js = require('../../Portable-Reasoning-in-Web-Assembly/sophia-wasm/pkg/sophia_wasm.js')
// https://github.com/BruJu/WasmTreeDataset
const wrapped_ds = require('../../Portable-Reasoning-in-Web-Assembly/sophia-wasm/pkg/wrappedtree.js')
// Graphy
const graphy_dataset = require("@graphy/memory.dataset.fast")

const { task, filename, stream, get_vmsize, performance } = require("./common.js")

// Run the required task
const do_task = {
    'query': () => query_nt(1),
    'query2': () => query_nt(2),
    'query3': () => query_nt(3),
    'query4': () => query_nt(4)
}[task];

do_task();


function query_nt(query_num) {
    let t_load, m_graph, t_first, t_rest;
    let start, duration;
    const format = "N-Triples";    
    let parser = new n3.Parser({ format: format });
    const mem0 = get_vmsize();
    start = performance.now();

    let isIterable = false;
    let store;
    switch (process.argv[4]) {
        case "Full":
            store = new sophia_js.FullDataset();
            break;
        case "Tree":
            store = new sophia_js.TreeDataset();
            break;
        case "Fast":
            store = new sophia_js.FastDataset();
            break;
        case "Light":
            store = new sophia_js.LightDataset();
            break;
        case "FullA":
            store = new sophia_js.FullDatasetToA();
            break;
        case "TreeA":
            store = new sophia_js.TreeDatasetToA();
            break;
        case "FastA":
            store = new sophia_js.FastDatasetToA();
            break;
        case "LightA":
            store = new sophia_js.LightDatasetToA();
            break;
        case "Array":
            store = new sophia_js.ArrayDataset();
            break;
        case "Sortable":
            store = new sophia_js.SDataset();
            break;
        case "Graphy":
            store = graphy_dataset();
            isIterable = true;
            break;
        case "Wrapped":
            store = new wrapped_ds();
            isIterable = true;
            break;
        default:
            console.error("Unknown dataset " + dataset);
            process.exit(7);
    }

    parser.parse(stream, (error, quad, prefixes) => {
        if (error) {
            console.error(error);
            process.exit(2);
        }
        
        
        if (quad) {
            store.add(quad);
        } else {
            duration = performance.now() - start;
            const mem1 = get_vmsize();
            t_load = duration/1000;
            m_graph = mem1-mem0

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
                let filtered_dataset = store.match(subject, predicate, object, graph);

                duration = performance.now() - start;
                let t_first = duration/1000;
                start = performance.now();


                let counter = 0;
                if (true) {
                    if (!isIterable) {
                        filtered_dataset.forEach(quad => { counter += 1; });
                    } else {
                        for (q of filtered_dataset) {
                            counter += 1;
                        }
                    }
                } else {
                    counter = filtered_dataset.size;
                }

                duration = performance.now() - start;
                t_last = duration/1000;

                return [t_first, t_last, counter, filtered_dataset];
            }
            
            let firstData = bench();
            let secondData = bench();
            // console.error(sophia_js.__wasm.memory.buffer);
            const mem2 = get_vmsize() - mem0;

            console.error(`retrieved: ${secondData[2]}`);
            console.log(`${t_load},${m_graph},${mem2},${firstData[0]},${firstData[1]},${secondData[0]},${secondData[1]}`);
            process.exit(0);
        }
    });
}

