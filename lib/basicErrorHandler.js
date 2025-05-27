module.exports = function basicErrorHandler(options) {
  options = options || {};
  var showStack = options.dumpExceptions || options.showStack;
  return function(err, req, res, next) {
    if (res.headersSent) return next(err);
    if (showStack && err && err.stack) {
      console.error(err.stack);
    }
    res.status(err && err.status || 500);
    res.end(err && err.message || 'Server Error');
  };
};
