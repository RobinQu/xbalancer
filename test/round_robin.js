var Balancer = require(".."),
    domain = require("domain"),
    request = require("superagent"),
    expect = require("chai").expect,
    helpers = require("./lib/helpers");


describe("RoundRobin Policy", function() {
  
  
  it("should balance equally to each http worker", function(done) {
    var servers = helpers.createServerGroup("http", 2, false),
        balancer,
        d = domain.create();
        
    //http server at 8000, 8001
    helpers.listen(servers, 8000, d.intercept(function() {
      balancer = new Balancer({
        targets: ["http://localhost:8000", "http://localhost:8001"],
        port: 8888
      });
      
      var i = servers.length, counter;
      counter = function(i) {
        servers[i].count++;
      };
      while(i--) {
        servers[i].count = 0;
        servers[i].on("request", counter.bind(null, i));
      }
      balancer.start(d.intercept(function() {
        i = 6;
        while(i--) {
          request.get("http://localhost:8888").end();
        }
        setTimeout(function() {
          servers.forEach(function(s) {
            expect(s.count).to.equal(3);
          });
          //close server
          helpers.close(servers);
          setTimeout(done, 300);
        }, 100);
      }));
    }));
    
    d.once("error", function(e) {
      helpers.close(servers);
      done(e);
    });
  });
  
});