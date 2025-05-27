module.exports = function basicAuth(user, pass) {
  return function(req, res, next) {
    var header = req.headers['authorization'] || '';
    var token = header.split(/\s+/).pop() || '';
    var auth = Buffer.from(token, 'base64').toString().split(':');
    var name = auth.shift();
    var password = auth.join(':');
    if (name === user && password === pass) {
      return next();
    }
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"');
    res.end('Access denied');
  };
};
