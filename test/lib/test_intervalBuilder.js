process.env.NODE_ENV = 'test';
var should = require('should');
var async = require('async');
var mongoose = require('../../bootstrap');
var IntervalBuilder = require('../../lib/intervalBuilder');
var Ping = require('../../models/ping');
var Check = require('../../models/check');
var CheckEvent = require('../../models/checkEvent');

var check1, check2, now; // fixtures

describe('intervalBuilder', function() {

  before(function(done) {
    if (mongoose.connection.readyState === 1) return done();
    mongoose.connection.once('open', done);
  });

  before(async function() {
    this.timeout(10000);
    await Ping.collection.deleteMany({});
    await Check.collection.deleteMany({});
    await CheckEvent.collection.deleteMany({});
  });

  before(function() {
    now = Date.now();
  });

  before(function(done) {
    check1 = new Check();
    check1.save().then(function() {
      async.series([
        function(cb) { Ping.createForCheck(false, now - 3000, 100, check1, 'dummy1', '', null, cb); },
        function(cb) { Ping.createForCheck(false, now - 2000, 100, check1, 'dummy2', '', null, cb); },
        function(cb) { Ping.createForCheck(true,  now - 1000, 100, check1, 'dummy3', '', null, cb); },
        function(cb) { Ping.createForCheck(true,  now,        100, check1, 'dummy4', '', null, cb); },
        function(cb) { Ping.createForCheck(true,  now + 1000, 100, check1, 'dummy5', '', null, cb); },
        function(cb) { Ping.createForCheck(false, now + 2000, 100, check1, 'dummy6', '', null, cb); },
        function(cb) { Ping.createForCheck(true,  now + 3000, 100, check1, 'dummy7', '', null, cb); }
      ], function(err){
        setTimeout(function(){ done(err); }, 50);
      });
    }).catch(done);
  });

  before(function(done) {
    check2 = new Check();
    check2.save().then(() => done(), done);
  });

  describe('addTarget', function() {

    it('should accept Check objects', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check1);
      builder.determineInitialState(now, function(err) {
        if (err) throw (err);
        builder.currentState.should.eql(1);
        done();
      });
    });

    it('should accept Check identifiers', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check1._id);
      builder.determineInitialState(now, function(err) {
        if (err) throw (err);
        builder.currentState.should.eql(1);
        done();
      });
    });

  });

  describe('#determineInitialState', function() {

    it('should set initial state to PAUSED for new Checks', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check2);
      builder.determineInitialState(now, function(err) {
        if (err) throw (err);
        builder.currentState.should.eql(-1);
        done();
      });
    });

    it('should set the initial state according to the latest ping', function(done) {
      var builder = new IntervalBuilder(check1);
      builder.addTarget(check1);
      builder.determineInitialState(now, function(err) {
        if (err) throw (err);
        builder.currentState.should.eql(1);
        done();
      });
    });

  });

  describe('#build', function() {

    it('should return a full pause array when there is no ping at all', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check2);
      builder.build(now, now + 1000, function(err, periods) {
        if (err) throw (err);
        periods.should.eql([[now, now + 1000, -1]]);
        done();
      });
    });

    it('should return an empty array when there is no down ping', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check1);
      builder.build(now + 3000, now + 6000, function(err, periods) {
        if (err) throw (err);
        periods.should.eql([]);
        done();
      });
    });

    it('should return a period ending at the end of the lookup period when the latest ping is down', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check1);
      builder.build(now - 2500, now - 2000, function(err, periods) {
        if (err) throw (err);
        periods.should.eql([ [now - 2500, now - 2000, 0] ]);
        done();
      });
    });

    it('should return an outage period even if the state at the beginning and at the end are up', function(done) {
      var builder = new IntervalBuilder();
      builder.addTarget(check1);
      builder.build(now - 1000, now + 3000, function(err, periods) {
        if (err) throw (err);
        periods.should.eql([ [ now + 2000, now + 3000, 0]]);
        done();
      });
    });

    it('should return several periods when an uptime period lies in the middle of the interval', async function() {
      this.timeout(5000);
      var builder = new IntervalBuilder();
      builder.addTarget(check1);
      const periods = await new Promise((resolve, reject) => {
        setTimeout(function() {
          builder.build(now - 4000, now + 3000, function(err, p) {
            if (err) return reject(err);
            resolve(p);
          });
        }, 200);
      });
      periods.length.should.eql(3);
      periods[0][2].should.eql(-1);
      periods[1][2].should.eql(0);
      periods[2][2].should.eql(0);
    });
  });
  
  after(async function() {
    this.timeout(10000);
    await Ping.collection.deleteMany({});
    await Check.collection.deleteMany({});
    await CheckEvent.collection.deleteMany({});
  });
});