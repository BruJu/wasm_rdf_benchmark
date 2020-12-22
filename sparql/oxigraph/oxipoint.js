"use strict";


// Based on Comunica Sparql End Point code
// https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql
// Licensied under the MIT License by Ghent University / Ruben Taelman / Joachim Van Herwegen

// Exposes a Sparql End Point that resorts on oxigraph JS API
// https://github.com/oxigraph/oxigraph/tree/master/js

// This script is made for benchmark purpose and should never be used in production.


const { MemoryStore } = require('oxigraph');

const SOURCE_FILE = "../bsbmtools-0.2/dataset.ttl"
const PORT = 3000;
const TIMEOUT = 60000000;

const ttl_read = require('@graphy/content.ttl.read');

const fs = require("fs");
const http = require("http");
const querystring = require("querystring");
const url = require("url");
const { exit } = require("process");
const rdf = require("rdf");

/**
 * An HTTP service that does exposes an oxigraph as a SPARQL endpoint.
 */
class HttpServiceSparqlEndpoint {
    constructor(oxistore) {
        this.oxistore = oxistore;
        this.timeout = TIMEOUT;
    }
    
    /**
     * Starts the server
     * @param {module:stream.internal.Writable} stdout The output stream to log to.
     * @param {module:stream.internal.Writable} stderr The error stream to log errors to.
     * @param {string} moduleRootPath The path to the invoking module.
     * @param {NodeJS.ProcessEnv} env The process env to get constants from.
     * @param {string} defaultConfigPath The path to get the config from if none is defined in the environment.
     * @param {(code: number) => void} exit The callback to invoke to stop the script.
     * @return {Promise<void>} A promise that resolves when the server has been started.
     */
    static runArgsInProcess(stdout, stderr, exit) {
        // allow both files as direct JSON objects for context
        const stream = fs.createReadStream(SOURCE_FILE);
        let streamOfQuads = stream.pipe(ttl_read());
        const oxistore = new MemoryStore();
        let c = 0;
        streamOfQuads
            .on('data', quad => { oxistore.add(quad); c+=1; } )
            .on('end', () => {
                console.error(c);

                return new Promise((resolve) => {
                    new HttpServiceSparqlEndpoint(oxistore).run(stdout, stderr)
                        .then(resolve)
                        .catch((reason) => {
                            console.error(reason);
                            stderr.write(reason);
                            exit(1);
                            resolve();
                        });
                    });

                console.error("coucou");
            });
    }
    
    /**
     * Start the HTTP service.
     * @param {module:stream.internal.Writable} stdout The output stream to log to.
     * @param {module:stream.internal.Writable} stderr The error stream to log errors to.
     */
    async run(stdout, stderr) {
        // Determine the allowed media types for requests
        const mediaTypes = {'application/json': 1};
        const variants = [];
        for (const type of Object.keys(mediaTypes)) {
            variants.push({ type, quality: mediaTypes[type] });
        }
        // Start the server
        const server = http.createServer(this.handleRequest.bind(this, variants, stdout, stderr));
        server.listen(PORT);
        server.setTimeout(2 * this.timeout); // unreliable mechanism, set too high on purpose
        stderr.write('Server running on http://localhost:' + PORT + '/\n');
    }
    /**
     * Handles an HTTP request.
     * @param {ActorInitSparql} engine A SPARQL engine.
     * @param {{type: string; quality: number}[]} variants Allowed variants.
     * @param {module:stream.internal.Writable} stdout Output stream.
     * @param {module:stream.internal.Writable} stderr Error output stream.
     * @param {module:http.IncomingMessage} request Request object.
     * @param {module:http.ServerResponse} response Response object.
     */
    async handleRequest(variants, stdout, stderr, request, response) {
        const mediaType = request.headers.accept && request.headers.accept !== '*/*'
            ? require('negotiate').choose(variants, request)[0].type : null;
        // Verify the path
        const requestUrl = url.parse(request.url || '', true);
        if (requestUrl.pathname !== '/sparql') {
            stdout.write('[404] Resource not found\n');
            response.writeHead(404, { 'content-type': HttpServiceSparqlEndpoint.MIME_JSON, 'Access-Control-Allow-Origin': '*' });
            response.end(JSON.stringify({ message: 'Resource not found' }));
            return;
        }
        
        // Parse the query, depending on the HTTP method
        let sparql;
        switch (request.method) {
            case 'POST':
                sparql = await this.parseBody(request);
                this.writeQueryResult(stdout, stderr, request, response, sparql, mediaType, false);
                break;
            case 'HEAD':
            case 'GET':
                sparql = requestUrl.query.query || '';
                this.writeQueryResult(stdout, stderr, request, response, sparql, mediaType, request.method === 'HEAD');
                break;
            default:
                stdout.write('[405] ' + request.method + ' to ' + requestUrl + '\n');
                response.writeHead(405, { 'content-type': HttpServiceSparqlEndpoint.MIME_JSON, 'Access-Control-Allow-Origin': '*' });
                response.end(JSON.stringify({ message: 'Incorrect HTTP method' }));
        }
    }
    /**
     * Writes the result of the given SPARQL query.
     * @param {ActorInitSparql} engine A SPARQL engine.
     * @param {module:stream.internal.Writable} stdout Output stream.
     * @param {module:stream.internal.Writable} stderr Error output stream.
     * @param {module:http.IncomingMessage} request Request object.
     * @param {module:http.ServerResponse} response Response object.
     * @param {string} sparql The SPARQL query string.
     * @param {string} mediaType The requested response media type.
     * @param {boolean} headOnly If only the header should be written.
     */
    async writeQueryResult(stdout, stderr, request, response, sparql, mediaType, headOnly) {
        if (!sparql) {
            stdout.write('[404] Resource not found\n');
            response.writeHead(404, { 'content-type': HttpServiceSparqlEndpoint.MIME_JSON, 'Access-Control-Allow-Origin': '*' });
            response.end(JSON.stringify({ message: 'Resource not found' }));
            return;
        }

        let is_construct = sparql.indexOf("CONSTRUCT") != -1;

        let result;
        try {
            result = this.oxistore.query(sparql);
        }
        catch (error) {
            stdout.write('[400] Bad request\n');
            response.writeHead(400, { 'content-type': HttpServiceSparqlEndpoint.MIME_PLAIN, 'Access-Control-Allow-Origin': '*' });
            response.end(error.toString());
            return;
        }
        //console.log(mediaType);
        //stdout.write('[200] ' + request.method + ' to ' + request.url + '\n');
        //stdout.write('      Requested media type: ' + mediaType + '\n');
        //stdout.write('      Received query: ' + sparql + '\n');
        response.writeHead(200, { 'content-type': mediaType, 'Access-Control-Allow-Origin': '*' });
        if (headOnly) {
            response.end();
            return;
        }
        let eventEmitter;
        try {

            if (!is_construct) {
                let bindingscats = [];
                let answers = [];
                
                // console.log(result);
                console.log(result.length);
                let isFirst = true;
                for (let binding of result) {
                    if (isFirst) {
                        for (let name of binding.keys()) {
                            bindingscats.push(name);
                        }
                        isFirst = false;
                    }
                    
                    let entry = {};

                    for (let b of bindingscats) {
                        let s = binding.get(b);
                        if (s == undefined)
                            continue;
                        let quad = rdf.factory.fromTerm(binding.get(b));

                        switch (quad.termType) {
                            case "NamedNode":
                                entry[b] = {
                                    type: "uri",
                                    value: quad.value
                                };
                                break;
                            case "Literal":
                                entry[b] = { type: "literal", value: quad.value };
                                if (quad.lang != undefined) {
                                    entry[b].lang = quad.lang;
                                }
                                if (quad.datatype != undefined) {
                                    entry[b].datatype = quad.datatype.value;
                                }
                                break;
                            default:
                                console.log(quad);
                                console.log("Can't be sent");
                                exit(1);
                                break;

                        }
                    }

                    answers.push(entry);
                }

                let data = {
                    "head": {
                    "vars": bindingscats
                    },
                    "results": {
                    "distinct": false,
                    "ordered": true,
                    "bindings": answers
                    }
                };

                //console.log(JSON.stringify(data));

                const content = JSON.stringify(data);
                response.end(content);
            } else {
                let l = "";

                for (let quad of result) {
                    let pureQuad = rdf.factory.fromQuad(quad);
                    l += pureQuad.subject.toCanonical()
                      + " " + pureQuad.predicate.toCanonical()
                      + " " + pureQuad.object.toCanonical();
                    if (pureQuad.graph.termType == "DefaultGraph") {
                        l += "\n.";
                    } else {
                        l += " " + pureQuad.graph.toCanonical + "\n. ";
                    }
                    l += "\n";
                }


                //console.log(result.length);
                //console.log(l);
                response.end(l);
            }
        }
        catch (error) {
            stdout.write('[400] Bad request, invalid media type\n');
            response.writeHead(400, { 'content-type': HttpServiceSparqlEndpoint.MIME_PLAIN, 'Access-Control-Allow-Origin': '*' });
            response.end('The response for the given query could not be serialized for the requested media type\n');

            console.log(error);
        }
        this.stopResponse(response, eventEmitter);
    }
    
    /**
     * Stop after timeout or if the connection is terminated
     * @param {module:http.ServerResponse} response Response object.
     * @param {NodeJS.ReadableStream} eventEmitter Query result stream.
     */
    stopResponse(response, eventEmitter) {
        // Note: socket or response timeouts seemed unreliable, hence the explicit timeout
        const killTimeout = setTimeout(killClient, this.timeout);
        response.on('close', killClient);
        function killClient() {
            if (eventEmitter) {
                // remove all listeners so we are sure no more write calls are made
                eventEmitter.removeAllListeners();
                eventEmitter.emit('end');
            }
            try {
                response.end();
            }
            catch (e) { /* ignore error */ }
            clearTimeout(killTimeout);
        }
    }
    /**
     * Parses the body of a SPARQL POST request
     * @param {module:http.IncomingMessage} request Request object.
     * @return {Promise<string>} A promise resolving to a query string.
     */
    parseBody(request) {
        return new Promise((resolve, reject) => {
            let body = '';
            request.setEncoding('utf8');
            request.on('error', reject);
            request.on('data', (chunk) => { body += chunk; });
            request.on('end', () => {

                process.stderr.write(body);
                const contentType = request.headers['content-type'];
                if (contentType && contentType.indexOf('application/sparql-query') >= 0) {
                    return resolve(body);
                }
                else if (contentType && contentType.indexOf('application/x-www-form-urlencoded') >= 0) {
                    return resolve(querystring.parse(body).query || '');
                }
                else {
                    return resolve(body);
                }
            });
        });
    }
}

HttpServiceSparqlEndpoint.MIME_PLAIN = 'text/plain';
HttpServiceSparqlEndpoint.MIME_JSON = 'application/json';
// tslint:disable:max-line-length
HttpServiceSparqlEndpoint.HELP_MESSAGE = `comunica-sparql-http exposes a Comunica engine as SPARQL endpoint

context should be a JSON object or the path to such a JSON file.

Usage:
  comunica-sparql-http context.json [-p port] [-t timeout] [-l log-level] [-i] [--help]
  comunica-sparql-http "{ \\"sources\\": [{ \\"type\\": \\"hypermedia\\", \\"value\\" : \\"http://fragments.dbpedia.org/2015/en\\" }]}" [-p port] [-t timeout] [-l log-level] [-i] [--help]

Options:
  -p            The HTTP port to run on (default: 3000)
  -t            The query execution timeout in seconds (default: 60)
  -l            Sets the log level (e.g., debug, info, warn, ... defaults to warn)
  -i            A flag that enables cache invalidation before each query execution.
  --help        print this help message
`;

HttpServiceSparqlEndpoint.runArgsInProcess(process.stdout, process.stderr, () => process.exit(1));




