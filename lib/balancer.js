var httpProxy = require("http-proxy"),
    http = require("http"),
    _ = require("lodash"),
    debug = require("debug")("balancer"),
    assert = require("assert"),
    policy = require("./policy"),
    domain = require("domain");

var Balancer = function(options) {
  if(!(this instanceof Balancer)) {
    return new Balancer(options);
  }
  this.port = options.port;
  assert(this.port, "should have port defined");
  this.policy = options.policy || new policy.RoundRobinPolicy(options.targets);
  this.server = options.server || http.createServer();
  this.proxy = httpProxy.createProxyServer({
    xfwd: true,
    ws: true
  });
  this.server.on("request", this.handleRequest());
  this.server.on("upgrade", this.handleUpgrade());
  this.server.on("listening", function() {
    debug("listening");
  });
  this.proxy.on("error", function(e) {
    debug(e);
  });
  // this.domain = options.domain || domain.create();
  // this.domain.add(this.proxy);
  // this.domain.on("error", function(e) {
  //   debug(e);
  // });
};

Balancer.prototype.handleRequest = function () {
  var self = this;
  return function(req, res) {
    debug("proxy web: %s", req.url);
    self.proxy.web(req, res, self.nextTarget(req));
  };
};

Balancer.prototype.handleUpgrade = function () {
  var self = this;
  return function(req, socket, head) {
    debug("proxy ws: %s", req.url);
    self.proxy.ws(req, socket, head, self.nextTarget(req));
  };
};

Balancer.prototype.nextTarget = function (req) {
  return this.policy.next(req);
};

Balancer.prototype.start = function(callback) {
  this.server.listen(this.port, callback);
};

_.extend(Balancer, policy);

module.exports = Balancer;