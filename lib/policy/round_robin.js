var assert = require("assert"),
    debug = require("debug")("roundrobin");

var RoundRobinPolicy = function(targets) {
  assert(targets, "should provide targets");
  this.targets = targets;
};

RoundRobinPolicy.prototype.next = function (req) {
  var target = this.targets.shift();
  this.targets.push(target);
  debug("next %o", target);
  return {
    target: target
  };
};

module.exports = RoundRobinPolicy;