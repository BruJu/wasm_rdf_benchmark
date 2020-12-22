# SPARQL benchmarks

**This is section is in work in progress**

- https://gist.github.com/BruJu/919c1d3c10dfed21553e4a6e9f910b2a 
- The used version of Comunica was v1.13.1


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


