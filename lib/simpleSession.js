module.exports = function simpleSession() {
  return function(req, res, next) {
    if (!req.session) {
      req.session = {};
    }
    next();
  };
};
