const express = require('express');
const bodyParser = require('body-parser');

module.exports = function(app) {
  // polyfill express.errorHandler if missing (accessing the property may throw)
  let hasErrorHandler = true;
  try {
    hasErrorHandler = typeof express.errorHandler === 'function';
  } catch (e) {
    hasErrorHandler = false;
  }
  if (!hasErrorHandler) {
    express.errorHandler = function() {
      return function(err, req, res, next) {
        if (res.headersSent) return next(err);
        res.status(err.status || 500);
        res.end(err.message || 'Server Error');
      };
    };
  }

  // polyfill express.basicAuth if missing
  if (typeof express.basicAuth !== 'function') {
    express.basicAuth = function(user, pass) {
      return function(req, res, next) {
        const header = req.headers['authorization'] || '';
        const token = header.split(/\s+/).pop() || '';
        const auth = Buffer.from(token, 'base64').toString().split(':');
        const name = auth.shift();
        const password = auth.join(':');
        if (name === user && password === pass) {
          return next();
        }
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"');
        res.end('Access denied');
      };
    };
  }

  // no-op middleware replacements for removed express helpers
  ['methodOverride', 'cookieParser', 'cookieSession'].forEach(function(name) {
    let fn;
    try { fn = express[name]; } catch (e) { fn = undefined; }
    if (typeof fn !== 'function') {
      express[name] = function() { return function(req, res, next) { next(); }; };
    }
  });

  // bodyParser replacement using body-parser package
  let hasBodyParser = false;
  try { hasBodyParser = typeof express.bodyParser === 'function'; } catch (e) {}
  if (!hasBodyParser) {
    express.bodyParser = function() {
      const urlenc = bodyParser.urlencoded({ extended: true });
      const jsonParser = bodyParser.json();
      return function(req, res, next) {
        urlenc(req, res, function(err) {
          if (err) return next(err);
          jsonParser(req, res, next);
        });
      };
    };
  }

  // polyfill app.configure
  if (typeof app.configure !== 'function') {
    app.configure = function() {
      const envs = Array.prototype.slice.call(arguments);
      let fn = envs.pop();
      if (typeof fn !== 'function') {
        envs.push(fn);
        fn = envs.pop();
      }
      if (!envs.length || envs.indexOf(app.get('env')) !== -1) {
        fn.call(app);
      }
      return app;
    };
  }

  // dummy router to satisfy old app.router usage
  try { app.router; } catch (e) { }
  app.router = express.Router();
};
