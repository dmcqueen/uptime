var should = require('should');
var timer = require('../../lib/timer');

describe('timer', function() {
  it('should execute the callback after the delay', function(done) {
    this.timeout(200);
    var start = Date.now();
    timer.createTimer(30, function() {
      var diff = Date.now() - start;
      diff.should.be.greaterThanOrEqual(30);
      done();
    });
  });

  it('should stop the callback and freeze time when stopped', function(done) {
    this.timeout(300);
    var called = false;
    var t = timer.createTimer(100, function() { called = true; });
    setTimeout(function() {
      t.stop();
      var stopped = t.getTime();
      setTimeout(function() {
        called.should.be.false();
        t.getTime().should.equal(stopped);
        done();
      }, 150);
    }, 50);
  });
});
