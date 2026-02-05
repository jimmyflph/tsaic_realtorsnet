// Quick test of reviews API
const http = require('http');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3008,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`${method} ${path}:`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response:`, data || '(empty)');
        console.log('---');
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`ERROR on ${method} ${path}:`, err.message);
      reject(err);
    });

    req.end();
  });
}

(async () => {
  try {
    await makeRequest('/api/realtors/2/reviews', 'GET');
  } catch (err) {
    console.error('Test failed:', err);
  }
  process.exit(0);
})();
