# Wasm RDF Benchmark

This repository purpose is to benchmark the performances of :

- Sophia Datasets ( https://github.com/pchampin/sophia_rs/ )
- Some personal implementation of Datasets ( https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly/tree/master/sophia-wasm/src )
- Both in native Rust and when exported to Web Assembly using the wrapper class proposed in https://github.com/BruJu/Portable-Reasoning-in-Web-Assembly used in NodeJs
- Other RDF.JS implementations (mainly Graphy https://graphy.link/ )
- Another RDF.JS implementation based on Rust/Wasm but not on Sophia https://github.com/BruJu/WasmTreeDataset

## Running the benchmarks

- `make` to (hopefully) install all dependencies but the one mentionnes below
- If you want to benchmark exported datasets / custom implementations of Datasets / WasmTreeDataset, make sure you have downloaded and compiled them (with `wasm-pack build --target nodejs` and make sure the `b_nodejs/sophia_js.js` points to the right js file (in the correct folder)

- Comment / Uncomment the benchmark you want to run in `./run_all.sh` and run it

- Results will be written in the csv folder


TODO : fix the Rust native benchmark (quick and dirty solution of implementing the Treed and coe Datasets in local Sophia clone was not a good decision for replicability)

TODO : resorting only on `./run_benchmark` instead of `run_all.sh` to call it is probably better


## License

This repository uses the https://github.com/pchampin/sophia_benchmark infrastructure as a base, licensied under the MIT Licence.

This repository itself is also licensed under the MIT Licence.


