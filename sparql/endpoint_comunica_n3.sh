#!/bin/bash
set -e

cd comunica-untouched
cd comunica/packages/actor-init-sparql-file/
NODE_ENV=production node bin/http.js "{ \"sources\": [\"../../../../bsbmtools-0.2/dataset.ttl\"]}"
