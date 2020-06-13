#!/usr/bin/env node

// We use n3 parser to be fair between every implementation
const n3 = require("n3");

// https://github.com/BruJu/WasmTreeDataset
const wrapped = require('../../Portable-Reasoning-in-Web-Assembly/rusttree/pkg/wrappedtree.js')
// Graphy
const graphy_dataset = require("@graphy/memory.dataset.fast")

const ttl_read = require('@graphy/content.ttl.read');

const { task, filename, stream, get_vmsize, performance } = require("./common.js")

// Run the required task
const do_task = {
    'query': () => query_nt(1),
    'query2': () => query_nt(2),
    'query3': () => query_nt(3),
    'query4': () => query_nt(4)
}[task];

do_task();

function get_query(query_num) {
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

    return [subject, predicate, object, graph];
}

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


function query_nt(query_num) {
    let store;
    switch (process.argv[4]) {
        case "n3":
            store = new n3.Store();
            break;
        case "Wrapped":
            store = new wrapped.TreeStore();
            break;
        default:
            let b = process.argv[4] || "no 4th arg"
            console.error("Unknown store " + b);
            process.exit(7);
    }

    let streamOfQuads = stream.pipe(ttl_read());

    const mem0 = get_vmsize();
    let start = performance.now();

    store.import(streamOfQuads)
        .on('end', () => {
            const duration = performance.now() - start;
            const mem1 = get_vmsize();
            const t_load = duration / 1000;
            const m_graph = mem1-mem0

            let mem2 = 0;

            let queryTerms = get_query(query_num);

            // It is badly indented to keep a sense of sequential code as from this point everything is a callback
            // It also keeps the same structure as sophia_js.js that benchmarks datasets
            bench(store, queryTerms, firstData => {
            bench(store, queryTerms, secondData => {
            console.error(`retrieved: ${secondData[2]}`);
            console.log(`${t_load},${m_graph},${mem2},${firstData[0]},${firstData[1]},${secondData[0]},${secondData[1]}`);
            process.exit(0);
            }); });
        })
        .on('error', error => {
            console.error(error);
            process.exit(2);

        });
}

