# Benchmarking WasmTree 

*This repository is currently in WIP to clean as much as possible the code / the instructions and make it auto-sufficient.*

This repository purpose is to benchmark the performances of :

- Sophia Datasets ( https://github.com/pchampin/sophia_rs/ )
- Some personal implementation of Datasets ( https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly/tree/master/sophia-wasm/src )
- Both in native Rust and when exported to Web Assembly using the wrapper class proposed in https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly used in NodeJs
- Other RDF.JS implementations (mainly Graphy https://graphy.link/ )
- Another RDF.JS implementation based on Rust/Wasm but not on Sophia https://github.com/BruJu/WasmTreeDataset

## Simple pattern matching benchmarks

- `make`
- Comment / Uncomment the benchmark you want to run in `./run_benchmark` for time measures, `./run_benchmark_load` for memory and run it

- Results will be written in the csv folder


## SPARQL Queries

https://gist.github.com/BruJu/919c1d3c10dfed21553e4a6e9f910b2a 

(/!\\ The used version of Comunica was v1.13.1)


## License

This repository uses the https://github.com/pchampin/sophia_benchmark infrastructure as a base, licensied under the MIT Licence.

This repository itself is also licensed under the MIT Licence.


