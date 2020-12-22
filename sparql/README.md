# SPARQL benchmarks

**This is section is in work in progress**


## Required

### BSBM

The BSBM Tools are required. You need to download them at the following URL and put the archive in this folder

https://sourceforge.net/projects/bsbmtools/files/latest/download

## Getting yarn on Ubuntu

`yarn` is also required. It can be a bit difficult to install as on Unbutu, yarn is a command linked to the `cmdtest`.

> https://github.com/yarnpkg/yarn/issues/2821#issuecomment-284181365

```
sudo apt remove cmdtest
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install yarn
```


## How to

- Download BSBM
- Run `./install.sh`


- In one terminal, start one of the enpoint, for example `./endpoint_comunica_wasmtree.sh`
- In another terminal, run BSBM `./run_bsbm.sh`


*About Oxigraph: * the format sent by Oxigraph is not understood by BSBM so the received number of quads is wrong. But we can see on OXigraph's console that quads are actually retrieved, and as we are more interested by speed than developping a proper SPARQL end point, we considered it was good enough for benchmarking purposes.
