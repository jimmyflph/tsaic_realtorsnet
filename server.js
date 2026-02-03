const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db.js');
const auth = require('./auth.js'); 
const db2 = require('./db_2.js');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
 
db2.initDB();
db2.getPool();
db2.getProspects();


function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif'
  };
  return types[ext] || 'application/octet-stream';
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        const user = await db.getUserByUsername(username);

        if (user && user.password === password) {
          const token = auth.generateToken(user);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token, role: user.role }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
    return;
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  if (pathname === '/api/prospects' && req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const prospects = await db.getProspects();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(prospects));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Server Error</h1>');
      }
    } else {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(content);
    }
  });
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
