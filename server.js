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

  if (pathname === '/api/signup' && req.method === 'POST') {
    // this is a buyer signup only
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password, role } = JSON.parse(body);
        role = "buyer";
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Username and password are required' }));
          return;
        }

        const newUser = await db2.createUser(username, password, role || 'client');
        const token = auth.generateToken(newUser);
        const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=3600';
        res.writeHead(201, { 
          'Content-Type': 'application/json',
          'Set-Cookie': `authToken=${token}; ${cookieOptions}`
        });
        res.end(JSON.stringify({ token, role: newUser.role, message: 'Signup successful' }));
      } catch (error) {
        if (error.message === 'Username already exists') {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Username already exists' }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      }
    });
    return;
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        const user = await db2.getUserByUsername(username);

        if (user && user.password === password) {
          const token = auth.generateToken(user);
          const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=3600';
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Set-Cookie': `authToken=${token}; ${cookieOptions}`
          });
          res.end(JSON.stringify({ token, role: user.role, message: 'Login successful' }));
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

  if (pathname === '/api/logout' && req.method === 'POST') {
    const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Set-Cookie': `authToken=; ${cookieOptions}`
    });
    res.end(JSON.stringify({ message: 'Logout successful' }));
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
