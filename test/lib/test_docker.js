process.env.NODE_ENV = 'test';
const assert = require('assert');
const { execSync } = require('child_process');
const http = require('http');

/**
 * Build the Dockerfile and ensure the API responds once the container starts.
 */
describe('Dockerfile', function() {
  this.timeout(300000); // allow up to 5 minutes for build/run

  let containerId;

  before(function() {
    // Skip the test entirely if Docker is not available
    try {
      execSync('docker --version', { stdio: 'ignore' });
    } catch (e) {
      this.skip();
    }
  });

  before(function() {
    execSync('docker build -t uptime-test .', { stdio: 'inherit' });
  });

  before(function() {
    containerId = execSync('docker run -d -p 8082:8082 uptime-test').toString().trim();
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function waitFor() {
        if (Date.now() - start > 60000) {
          return reject(new Error('container did not start'));
        }
        http.get('http://localhost:8082/api/checks', res => {
          if (res.statusCode === 200) {
            res.resume();
            return resolve();
          }
          setTimeout(waitFor, 1000);
        }).on('error', () => setTimeout(waitFor, 1000));
      })();
    });
  });

  it('responds to /api/checks', function(done) {
    http.get('http://localhost:8082/api/checks', res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        assert.ok(Array.isArray(data));
        done();
      });
    }).on('error', done);
  });

  after(function() {
    if (containerId) {
      execSync(`docker rm -f ${containerId}`, { stdio: 'inherit' });
    }
  });
});
