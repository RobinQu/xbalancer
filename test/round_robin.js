var Balancer = require(".."),
    domain = require("domain"),
    WebSocket = require("ws"),
    sinon = require("sinon"),
    debug = require("debug")("round_robin"),
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
        helpers.attack("http://localhost:8888", 6, function(e, res, body) {
          expect(body).to.equal("http");
        });
        setTimeout(function() {
          servers.forEach(function(s) {
            expect(s.count).to.equal(3);
          });
          //close server
          helpers.close(servers);
          balancer.close();
          setTimeout(done, 300);
        }, 100);
      }));
    }));
    
    d.once("error", function(e) {
      try {
        balancer.close();
      } catch(ex) {}
      helpers.close(servers);
      done(e);
      d.dispose();
    });
  });
  
  it("should support ws server", function(done) {
    var servers = helpers.createServerGroup("ws", 2, false),
        d = domain.create();
    
    
    helpers.listen(servers, 8000, d.intercept(function() {
      var balancer = new Balancer({
        targets: ["http://localhost:8001", "http://localhost:8000"],
        port: 8888
      });
      
      balancer.start(function() {
        helpers.attack("http://localhost:8888", 4, function(e, res, body) {
          expect(body).to.equal("http");
        });
      });
      
      var i = 4, clients = [], c, onmessage, onmessage2, msg1 = "from server", msg2 = "from client";
      onmessage = sinon.spy();
      onmessage2 = sinon.spy();
      
      while(i--) {
        c = new WebSocket("ws://localhost:8888");
        c.on("message", onmessage);
        clients.push(c);
      }
      servers.forEach(function(s) {
        s.count = 0;
        s.on("connection", function(c) {
          c.on("message", onmessage2);
          c.on("message", function() {
            s.count++;
          });
          c.send(msg1);
        });

      });
      setTimeout(function() {
        servers.forEach(function(s) {
          expect(s.clients.length).to.equal(2);
        });
        //all client receives the message
        expect(onmessage.callCount).to.equal(4);
        //check first call
        expect(onmessage.firstCall.args[0]).to.equal(msg1);
        
        clients.forEach(function(c) {
          c.send(msg2);
        });
        setTimeout(function() {
          //all messages should be handled by a different server
          expect(onmessage2.callCount).to.equal(4);
          servers.forEach(function(s) {
            //4 clients send 4 messages in total to 2 servers
            expect(s.count).to.equal(2);
          });
          helpers.close(servers);
          balancer.close();
          done();
        }, 100);
      }, 100);
      
    }));
    
    d.once("error", function(e) {
      debug(e);
      try {
        balancer.close();
      } catch(ex) {}
      helpers.close(servers);
      done(e);
    });
    
  });
  
});