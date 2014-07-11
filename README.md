# xBalancer

[![Build Status](https://travis-ci.org/RobinQu/xbalancer.svg?branch=master)](https://travis-ci.org/RobinQu/xbalancer)

Load balancer for http(s) and websocket services

Current supported balance policy:

* Round robin: requests are evenly distributed to each worker

TODO:

* Least connected: requests are always distributed to the worker that has least connected clients
* Weighted: requests are distributed according the weight assgined
* IP Hashing: The target worker is determined by the hash of IP address of the client that initiated the request


## Usage

Make a round-robin load balancer:

```
var balancer = require("xbalancer")({
  port: 8888,
  targets: ["http://localhost:8001", "http://localhost:8002"]
});
balancer.start(function() {
  console.log("xBalancer is up and running at port 8888");
});
```

That's dead simple!

Remember: 

* proxying websocket is enabled by default
* this is basically a reverse proxy


## TODO

* Benchmarks
* Really hopes to find a way to do Direct Route or IP Tunneling.

## License 

MIT