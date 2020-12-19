const fs = require("fs");
const { performance } = require("perf_hooks");
const n3 = require("n3");

const filename = process.argv[3];
if (filename === undefined) {
    console.error(`usage: node ${process.argv[1]} <task> <filename>}`);
    process.exit(9);
}

const stream = fs.createReadStream(filename);

function get_vmsize() {
    txt = fs.readFileSync("/proc/self/status", encoding="utf8");
    val = txt.match(/VmSize:\W*([0-9]+) kB/).pop();
    return Number.parseInt(val);
}

function taskValidator(validTasks) {
    const task = process.argv[2];

    if (validTasks.indexOf(task) === -1) {
        console.error(`task must be one of ${validTasks}`);
        process.exit(10);
    }

    console.error(`task: ${task}`);

    return task;
}

function datasetValidator(validDatasets, text="dataset") {
    let dataset = validDatasets[process.argv[4]];

    if (dataset === undefined) {
        console.error("Unknown " + text + ": " + process.argv[4]);
        process.exit(7);
    }

    return dataset;
}

function patternToTerms(pattern) {
    let subject   = undefined;
    let predicate = undefined;
    let object    = undefined;
    let graph     = undefined;

    if (pattern === "S") {
        subject = n3.DataFactory.namedNode('http://dbpedia.org/resource/Vincent_Descombes_Sevoie');
    } else if (pattern === "SG") {
        subject = n3.DataFactory.namedNode('http://dbpedia.org/resource/Vincent_Descombes_Sevoie');
        graph = n3.DataFactory.defaultGraph();
    } else if (pattern === "PO") {
        predicate = n3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        object = n3.DataFactory.namedNode('http://dbpedia.org/ontology/Person');
    } else if (pattern === "POG") {
        predicate = n3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        object = n3.DataFactory.namedNode('http://dbpedia.org/ontology/Person');
        graph = n3.DataFactory.defaultGraph();
    } else {
        console.error("Unknown pattern: " + pattern);
        process.exit(15);
    }

    return [subject, predicate, object, graph];
}


exports.taskValidator = taskValidator;
exports.datasetValidator = datasetValidator;
exports.performance = performance;
exports.stream = stream;
exports.get_vmsize = get_vmsize;
exports.patternToTerms = patternToTerms;
