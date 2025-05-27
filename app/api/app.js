/**
 * Module dependencies.
 */
var express    = require('express');
var errorHandler = require('../../lib/basicErrorHandler');
var Check      = require('../../models/check');
var CheckEvent = require('../../models/checkEvent');

var app = module.exports = express();

var debugErrorHandler = function() {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (app.get('env') === 'development' || app.get('env') === 'test') {
  debugErrorHandler();
} else {
  app.use(errorHandler());
}


// up count
var upCount;
var refreshUpCount = function(callback) {
  var count = { up: 0, down: 0, paused: 0, total: 0 };
  Check
  .find()
  .select({ isUp: 1, isPaused: 1 })
  .exec(function(err, checks) {
    if (err) return callback(err);
    checks.forEach(function(check) {
      count.total++;
      if (check.isPaused) {
        count.paused++;
      } else if (check.isUp) {
        count.up++;
      } else {
        count.down++;
      }
    });
    upCount = count;
    callback();
  });
};

Check.on('afterInsert', function() { upCount = undefined; });
Check.on('afterRemove', function() { upCount = undefined; });
CheckEvent.on('afterInsert', function() { upCount = undefined; });

app.get('/checks/count', function(req, res, next) {
  if (upCount) {
    res.json(upCount);
  } else {
    refreshUpCount(function(err) {
      if (err) return next(err);
      res.json(upCount);
    });
  }
});

// Routes

require('./routes/check')(app);
require('./routes/tag')(app);
require('./routes/ping')(app);

// route list
app.get('/', function(req, res) {
  var routes = [];
  app._router.stack.forEach(function(m) {
    if (m.route) {
      var path = (app.route || '') + m.route.path;
      Object.keys(m.route.methods).forEach(function(verb) {
        routes.push({ method: verb.toUpperCase(), path: path });
      });
    }
  });
  res.json(routes);
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
