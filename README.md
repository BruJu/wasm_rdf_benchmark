# Benchmarking WasmTree 

*This repository is currently in WIP to clean as much as possible the code / the instructions and make it auto-sufficient.*

This repository purpose is to benchmark the performances of :

- [Sophia Datasets in native Rust](https://github.com/pchampin/sophia_rs/)
- [Some personal implementation of Sophia Datasets in native Rust, including **TreeDataset**](https://github.com/BruJu/wasmify-sophia/tree/master/bjdatasets)
- [Their exportation in Javascript when using sophia-wasm adapters / wasm-bindgen](https://github.com/BruJu/wasmify-sophia)
- [**WasmTree**, an RDF.JS implementation which mixes Rust and Javascript code](https://github.com/BruJu/WasmTreeDataset)
- They are compared with [**Graphy**](https://www.npmjs.com/package/graphy) and [**n3.js**](https://www.npmjs.com/package/n3)

> *Our measures for RDF.JS evaluation are in the [results](results/) folder and the plots in the [associated jupyter notebook](results/plot.ipynb).*

## How to reproduce the benchmarks

- Node.JS, npm, rustc and cargo are required
- Run `make` to download and install all the dependencies

### Simple pattern matching benchmarks

- Run `./pattern_matching_benchmark`
    - `./pattern_matching_benchmark WasmTreeEvaluation 10+50` for Simple Pattern Matching
    - `./pattern_matching_benchmark WasmTreeAblation 20` for the repartition comparison (with the ablation test)

- Results will be written in the csv folder `csv/bench_currentdate.csv`

### Initialization / Loading benchmark

- `./loading_benchmark <file> <number_of_runs = 1>`

- The following RDF.JS datasets will be evaluated :
    - TreeDataset with 1 and 6 indexes
    - WasmTree with 1 and 6 indexes
    - Graphy
    - n3.js (using its `addQuad` method to simulate its behaviour if it was a Dataset)

- Results will written be in csv format in `csv/load_bench_currentdate.csv`

### SPARQL Queries using BSBM

[See the SPARQL dedicated section.](sparql) **(TODO)**


## License

This repository uses the [sophia benchmark](https://github.com/pchampin/sophia_benchmark) infrastructure as a base, licensied under the MIT License.

This repository itself is also licensed under the MIT License.
