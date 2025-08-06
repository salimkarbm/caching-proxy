

## Description
A CLI tool that starts a caching proxy server, it will forward requests to the actual server and cache the responses. If the same request is made again, it will return the cached response instead of forwarding the request to the server.

## added features
Added Features:
1. Statistics Endpoint (/_proxy_stats):

    - Uptime monitoring

    - Request counts

    - Cache hit rate

    - Memory usage

2. Improved Error Handling:

   - Better error logging

   - Timeout handling

   - Connection reset detection

3. Enhanced Caching:

    - More sophisticated cache key generation

    - Only cache successful responses (2xx)

    - Better buffer handling

4. Security Improvements:

    - URL validation

    - Rate limiting infrastructure (ready to implement)

    - Request timeout handling

5. Observability:

    - Detailed logging
  
    - Performance metrics

    - Debug information

6. Resource Management:

    - Proper cleanup on shutdown

    - Memory usage monitoring

7. Configuration Options:

    - Enable/disable stats endpoint

    - Customizable timeouts


## Project setup

The following steps outline will set you up on how to install the app on your local machine.

1. 
```bash
# Clone this repository 
git clone https://github.com/salimkarbm/caching-proxy.git
```
2. 
```bash
# From the terminal, change directory to caching-proxy folder 
$ cd caching-proxy
```
3. 
```bash
# Run This will install the necessary packages and dependencies based on the supplied package.json.
$ npm install
```
4. 
```bash
# Then run the app with the command 
$ nest start
```

## Compile and run the project

```bash
# start the actual server without the proxy server 
$ nest start
```

```bash
# start the actual server and the proxy server
$ nest start -- caching-proxy --port=3128 --origin=http://localhost:4000
```

- --port is the port on which the caching proxy server will run.
- --origin is the URL of the server to which the requests will be forwarded.

```bash
#For example, if the user runs the following command:
$ nest start caching-proxy --port 3128 --origin http://localhost:3000
```

All of the dependencies required are listed in the package.json file. Use `npm install` on the command line.

> However, you will need to install node and NestJs globally on your local machine

The caching proxy server should start on port 3000 and forward requests to http://localhost:3000

Taking the above example, if the user makes a request to http://localhost:3000, the caching proxy server will forward the request to http://localhost:3000, return the response along with headers and cache the response. Also, add the headers to the response that indicate whether the response is from the cache or the server.

### If the response is from the cache
X-Cache: HIT

### If the response is from the origin server
X-Cache: MISS
If the same request is made again, the caching proxy server should return the cached response instead of forwarding the request to the server.


```bash
# You can also clear the cache by running a command like following
$ nest start -- caching-proxy --clear-cache
```

## :handshake: Contributing
Contributions are currently not allowed ❌ but please feel free to submit issues and feature requests ✅

## Support

   - Give a :star: if you like this project

## Stay in touch

- Github - [@salimkarbm](https://github.com/salimkarbm)
- LinkedIn - [Salim Imuzai](https://www.linkedin.com/in/salim-karbm)
- Twitter - [@salimkarbm](https://twitter.com/salimkarbm)


