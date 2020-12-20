# Benchmarking WasmTree 

*This repository is currently in WIP to clean as much as possible the code / the instructions and make it auto-sufficient.*

This repository purpose is to benchmark the performances of :

- [Sophia Datasets in native Rust](https://github.com/pchampin/sophia_rs/)
- [Some personal implementation of Sophia Datasets in native Rust, including **TreeDataset**](https://github.com/BruJu/wasmify-sophia/tree/master/bjdatasets)
- [Their exportation in Javascript when using sophia-wasm adapters / wasm-bindgen](https://github.com/BruJu/wasmify-sophia)
- [**WasmTree**, an RDF.JS implementation which mixes Rust and Javascript code](https://github.com/BruJu/WasmTreeDataset)
- They are compared with [**Graphy**](https://www.npmjs.com/package/graphy) and [**n3.js**](https://www.npmjs.com/package/n3)

## How to reproduce the benchmarks

- Node.JS, npm, rustc and cargo are required
- Run `make` to download and install all the dependencies

### Simple pattern matching benchmarks

- Comment / Uncomment the benchmark you want to run in `./run_benchmark` for time measures, `./run_benchmark_load` for memory and run it

- Results will be written in the csv folder

### Initialization / Loading benchmark

- `./benchmark_loading <file> <number_of_runs = 1>`

- The following RDF.JS datasets will be evaluated :
    - TreeDataset with 1 and 6 indexes
    - WasmTree with 1 and 6 indexes
    - Graphy
    - n3.js (using its `addQuad` method to simulate its behaviour if it was a Dataset)

- Results will written be in csv format in `csv/load_bench_currentdate.csv`

### SPARQL Queries

https://gist.github.com/BruJu/919c1d3c10dfed21553e4a6e9f910b2a 

(/!\\ The used version of Comunica was v1.13.1)


## License

This repository uses the https://github.com/pchampin/sophia_benchmark infrastructure as a base, licensied under the MIT Licence.

This repository itself is also licensed under the MIT Licence.
