var http = require("http"),
    https = require("https"),
    fs = require("fs"),
    path = require("path"),
    request = require("superagent"),
    debug = require("debug")("helpers"),
    ws = require("ws");

exports.createHttpServer = function(secured) {
  var callback = function(req, res) {
    res.end(secured ? "https" : "http");
  };
  if(secured) {
    return http.createServer({
      key: fs.readFileSync(path.join(__dirname, "./key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "./cert.pem"))
    }, callback);
  } else {
    return http.createServer(callback);
  }
};

exports.createWebsocketServer = function(secured) {
  var httpServer = exports.createHttpServer(secured);
  return new ws.Server({server: httpServer});
};

exports.createServerGroup = function(type, num, secured) {
  var func = type === "ws" ? exports.createWebsocketServer : exports.createHttpServer,
      servers = [];
  while(num--) {
    servers.push(func(secured));
  }
  return servers;
};

exports.listen = function(servers, startPort, callback) {
  var i = 0,
      port = startPort;
  var listen = function(cb) {
    var s = servers[i];
    setTimeout(function() {
      s.listen(port, cb);
    }, 100);
  };
  var next = function(e) {
    if(e) {
      if(callback) {
        callback(e);
      } else {
        debug(e);
      }
      return;
    }
    i++;
    port++;
    if(i === servers.length) {
      if(callback) {
        callback();
      }
    } else {
      listen(next);
    }
  };
  
  listen(next);
  
};


exports.close = function(servers, callback) {
  var i = 0, next, close;
  
  close = function(cb) {
    try {
      servers[i].close(cb);
    } catch(e) {
      debug(e);
      cb(e);
    }
  };
  next = function(e) {
    if(e) {
      if(callback) {
        callback(e);
      }
      return;
    }
    i++;
    close(next);
  };
  close(next);
  
};

exports.attack = function(url, num) {
  while(num--) {
    request.get(url).end();
  }
};