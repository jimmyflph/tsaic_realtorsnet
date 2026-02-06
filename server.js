const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const bcrypt = require('bcryptjs');
const db = require('./db.js');
const auth = require('./auth.js'); 
const db2 = require('./db_2.js');
// const { use } = require('react');

const PORT = 3006;
const PUBLIC_DIR = path.join(__dirname, 'public');
 
db2.initDB();
db2.getPool();
// db2.getProspects();


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

// Check if user is a realtor (for protecting realtor-only routes)
// Check if user is a realtor (for protecting realtor-only routes)
function checkRealtorAccess(req, res) {
  try {
    // Prefer Authorization header but fall back to server-set cookie `authToken`
    let token = '';
    const authHeader = req.headers.authorization || '';
    if (authHeader) token = authHeader.replace('Bearer ', '').trim();

    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      for (const c of cookies) {
        if (c.startsWith('authToken=')) {
          token = c.substring('authToken='.length);
          break;
        }
      }
    }

    if (!token) {
      serveUnauthorizedPage(res);
      return false;
    }

    const decoded = auth.verifyToken(token);
    if (!decoded || decoded.role !== 'realtor') {
      serveUnauthorizedPage(res);
      return false;
    }

    return true;
  } catch (error) {
    serveUnauthorizedPage(res);
    return false;
  }
}

// Serve the unauthorized/403 error page
function serveUnauthorizedPage(res) {
  const filePath = path.join(PUBLIC_DIR, 'unauthorized.html');
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('<h1>403 Forbidden</h1><p>Access Denied</p>');
    } else {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end(content);
    }
  });
}

// Main request handler
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
    console.log("signup request received"); 
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
       console.log("signup body:", body);
        const { username, password, email } = JSON.parse(body);
        role = "buyer";

        console.log(username, password, role);
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Username and password are required' }));
          return;
        }

        const newUser = await db2.createUser(username, password, role || 'buyer');
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
    console.log("login body 2:", body);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        console.log("login body:", body);
        const user = await db2.getUserByUsername(username);

        console.log("login user:", user);
        if (user && await bcrypt.compare(password, user.password)) {
          const token = auth.generateToken(user);
          const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=3600';
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Set-Cookie': `authToken=${token}; ${cookieOptions}`
          });
          res.end(JSON.stringify({ token, role: user.role, message: 'Login successful' }));
        } else {
          console.log("Invalid credentials for user:", username);
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
    console.log("chat api called");
    console.log("chat api called");
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);
        console.log("chat message received:", message);
        console.log("chat message received:", message);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // Query the external RAG API
        const encodedMessage = encodeURIComponent(message);
        const apiUrl = `https://realtorsnet-rag.onrender.com/api?qstn=${encodedMessage}`;
        console.log("Querying RAG API:", apiUrl);
        console.log("Querying RAG API:", apiUrl);

        try {
          const https = require('https');
          https.get(apiUrl, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
              try {
                const parsedData = JSON.parse(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: parsedData.message || parsedData.answer || data }));
              } catch (parseError) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: data || 'No response from API' }));
              }
            });
          }).on('error', (error) => {
            console.error('API call error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error querying API: ' + error.message }));
          });
        } catch (apiError) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Server error' }));
        }
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
      const realtorId = user.id;
      const prospects = await db2.getProspects(realtorId, 1, 10);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(prospects));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // Paginated prospects endpoint
  if (pathname === '/api/view-prospects' && req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const query = parsedUrl.query;
      const page = parseInt(query.page) || 1;
      const maxItems = parseInt(query.maxItems) || 10;

      if (page < 1 || maxItems < 1) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid page or maxItems' }));
        return;
      }

      const realtorId = user.id;
      const result = await db2.getProspects(realtorId, page, maxItems);
      const prospects = result.prospects;
      const totalRecords = result.totalRecords;
      
      const totalPages = Math.ceil(totalRecords / maxItems);
 console.log('###paginated prospects api### ');
 console.log('###paginated prospects api### ');
 console.log('###paginated prospects api### ');
  console.log(prospects);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        prospects: prospects,
        pagination: {
          page,
          maxItems,
          totalRecords,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

    // SEARCH for buyers by name, email, or city (excluding already prospected buyers)
    if (pathname === '/api/search-buyers' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = auth.verifyToken(token);

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      try {
        const searchQuery = parsedUrl.query.q;

        if (!searchQuery) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Search query is required' }));
          return;
        }

        const realtorId = user.id;
        const buyers = await db2.searchBuyersExcludeProspects(searchQuery, realtorId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(buyers));
      } catch (error) {
        console.error('Error searching buyers:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

  // GET individual prospect details
  const prospectMatch = pathname.match(/^\/api\/prospect\/(\d+)$/);
  if (prospectMatch && req.method === 'GET') {
    const prospectId = parseInt(prospectMatch[1]);
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const prospect = await db2.getProspectById(prospectId);
      if (!prospect) {
        console.log(`Prospect ${prospectId} not found for user ${user.id}`);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Prospect not found' }));
        return;
      }

      // Verify user is the realtor for this prospect
      if (prospect.realtor !== user.id) {
        console.log(`Unauthorized: User ${user.id} is not the realtor for prospect ${prospectId}`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(prospect));
    } catch (error) {
      console.error(`Error retrieving prospect ${prospectId}:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error', details: error.message }));
    }
    return;
  }

  // CREATE new prospect
  if (pathname === '/api/prospect' && req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { userId, fullname, email, status, notes } = JSON.parse(body);

        // If userId is provided, create prospect linked to existing buyer
        if (userId) {
          const prospect = await db2.linkUserProspect(userId, notes || '', status || 'Active', user.id);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(prospect));
          return;
        }
 
      } catch (error) {
        console.error('Error creating prospect:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
    return;
  }

  // DELETE individual prospect
  if (prospectMatch && req.method === 'DELETE') {
    const prospectId = parseInt(prospectMatch[1]);
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      const result = await db2.deleteProspect(prospectId);
      if (!result) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Prospect not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Prospect deleted successfully', id: prospectId }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // REALTY CRUD ENDPOINTS
  if (pathname === '/api/realty' && req.method === 'GET') {
    try {
      const query = parsedUrl.query || {};
      // If requester asked for their own properties, require auth and return only those
      if (query.mine === 'true') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = auth.verifyToken(token);
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        const realties = await db2.getRealtiesByRealtor(user.id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(realties));
        return;
      }

      // If realtorId is specified, return only that realtor's properties
      if (query.realtorId) {
        const realtorId = parseInt(query.realtorId);
        const realties = await db2.getRealtiesByRealtor(realtorId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(realties));
        return;
      }

      // If search query or isrental filter present, use searchRealties with pagination
      if (query.q || query.isrental || query.page || query['max-items']) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const maxItems = Math.max(1, parseInt(query['max-items']) || 12);
        const q = query.q || '';
        const isrental = query.isrental;
        const data = await db2.searchRealties(q, isrental, page, maxItems);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }

      const realties = await db2.getRealties();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(realties));
    } catch (error) {
      console.log("error getting realty " , error);
      console.log(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  if (pathname === '/api/realty' && req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { title, description, isrental, price, amenities, address, images } = JSON.parse(body);

        if (!title || !description || address === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Title, description, and address are required' }));
          return;
        }

          const realty = await db2.createRealty(title, description, isrental || false, price, amenities, address, user.id, images || []);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(realty));
      } catch (error) {
        if (error.code === '23505') {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Title already exists' }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      }
    });
    return;
  }

  // Match /api/realty/:id patterns
  const realtyIdMatch = pathname.match(/^\/api\/realty\/(\d+)$/);
  if (realtyIdMatch) {
    const realtyId = parseInt(realtyIdMatch[1]);

    if (req.method === 'GET') {
      try {
        const realty = await db2.getRealtyById(realtyId);
        if (!realty) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Realty not found' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(realty));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = auth.verifyToken(token);

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { title, description, isrental, price, amenities, address, images } = JSON.parse(body);

          if (!title || !description || address === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Title, description, and address are required' }));
            return;
          }

          // Verify user owns this realty
          const existingRealty = await db2.getRealtyById(realtyId);
          if (!existingRealty) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Realty not found' }));
            return;
          }

          if (existingRealty.realtor !== user.id) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access denied' }));
            return;
          }

          const realty = await db2.updateRealty(realtyId, title, description, isrental || false, price, amenities, address, images || []);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(realty));
        } catch (error) {
          console.error('Error updating realty:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = auth.verifyToken(token);

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      try {
        // Verify user owns this realty
        const existingRealty = await db2.getRealtyById(realtyId);
        if (!existingRealty) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Realty not found' }));
          return;
        }

        if (existingRealty.realtor !== user.id) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Access denied' }));
          return;
        }

        const result = await db2.deleteRealty(realtyId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Realty deleted successfully', id: realtyId }));
      } catch (error) {
        console.error('Error deleting realty:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }
  }

  if (pathname === '/api/realtor-login' && req.method === 'POST') {
      // loging realtor
    let body = '';
    req.on('data', chunk => body += chunk);
    console.log("login body 2:", body);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        console.log("login body:", body);
        const user = await db2.getUserByUsername(username);

        console.log("login user realtor:", user);
        console.log("login user null:", (user === null) );
        console.log("login user null 2:", (user == null) );
        console.log("login user null 3:", (user == false) );

        if (user && await bcrypt.compare(password, user.password)) {
          const token = auth.generateToken(user);
          const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=3600';
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Set-Cookie': `authToken=${token}; ${cookieOptions}`
          });
          res.end(JSON.stringify({ token, role: user.role, message: 'Login successful' }));
        } else {
          console.log("Invalid credentials for user:", username);
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

  // API: get user by username (public, for reply page)
  if (pathname === '/api/user' && req.method === 'GET') {
    try {
      const username = parsedUrl.query.username;
      if (!username) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'username is required' }));
        return;
      }
      const user = await db2.getUserByUsername(username);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: user.id, username: user.username, fullname: user.fullname, email: user.email }));
    } catch (err) {
      console.error('Error fetching user by username:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // API: list realtors
  if (pathname === '/api/realtors' && req.method === 'GET') {
    try {
      const realtors = await db2.getRealtors(200);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(realtors));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // API: get realtor by id
  const realtorIdMatch = pathname.match(/^\/api\/realtors\/(\d+)$/);
  if (realtorIdMatch && req.method === 'GET') {
    try {
      const id = parseInt(realtorIdMatch[1]);
      const user = await db2.getUserById(id);
      if (!user || user.role !== 'realtor') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Realtor not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // API: get/post reviews for realtor
  const realtorReviewMatch = pathname.match(/^\/api\/realtors\/(\d+)\/reviews$/);
  
  if (realtorReviewMatch && req.method === 'GET') {
    try {
      const realtorId = parseInt(realtorReviewMatch[1]);
      const queryParams = new URLSearchParams(url.parse(req.url).query);
      const page = Math.max(1, parseInt(queryParams.get('page')) || 1);
      const maxItems = Math.max(1, parseInt(queryParams.get('maxItems')) || 10);
      
      const data = await db2.getReviewsByRealtorId(realtorId, page, maxItems);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // API: submit review for realtor (POST - persist to DB)
  if (realtorReviewMatch && req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.verifyToken(token);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const realtorId = parseInt(realtorReviewMatch[1]);
        
        // Prevent realtor from reviewing themselves
        if (user.id === realtorId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'You cannot review yourself' }));
          return;
        }
        
        // Check if review already exists
        const reviewExists = await db2.checkReviewExists(realtorId, user.id);
        if (reviewExists) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'You have already reviewed this realtor' }));
          return;
        }

        const { rating, review } = JSON.parse(body || '{}');
        
        if (!rating) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Rating is required' }));
          return;
        }

        const reviewRecord = await db2.createReview(realtorId, user.id, rating, review || '');
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reviewRecord));
      } catch (err) {
        console.error('Error creating review:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
    return;
  }

    // API: get logged-in realtor's reviews (my reviews)
    if (pathname === '/api/my-reviews' && req.method === 'GET') {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = auth.verifyToken(token);

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        // Get reviews for the logged-in realtor - fetch all without pagination for backward compatibility
        const data = await db2.getReviewsByRealtorId(user.id, 1, 10000);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.reviews));
      } catch (error) {
        console.error('Error fetching my reviews:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

    // API: get messages for logged-in user
    if (pathname === '/api/messages' && req.method === 'GET') {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = auth.verifyToken(token);

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        // Get query parameters for pagination
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const page = Math.max(1, parseInt(urlObj.searchParams.get('page')) || 1);
        const maxItems = Math.max(1, parseInt(urlObj.searchParams.get('maxItems')) || 10);

        // Get messages for the logged-in user
        const data = await db2.getMessagesByUserId(user.id, page, maxItems);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

    // API: get sent messages by logged-in user
    if (pathname === '/api/my-sent-messages' && req.method === 'GET') {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = auth.verifyToken(token);

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        // Get query parameters for pagination
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const page = Math.max(1, parseInt(urlObj.searchParams.get('page')) || 1);
        const maxItems = Math.max(1, parseInt(urlObj.searchParams.get('maxItems')) || 10);

        // Get sent messages by the logged-in user
        const data = await db2.getMessagesSentByUserId(user.id, page, maxItems);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching sent messages:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

    // API: create a new message
    if (pathname === '/api/messages' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const token = req.headers.authorization?.replace('Bearer ', '');
          const user = auth.verifyToken(token);

          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          const { messageTo, title, content } = JSON.parse(body);
          const message = await db2.createMessage(user.id, messageTo, title, content);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(message));
        } catch (error) {
          console.error('Error creating message:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      });
      return;
    }

    // API: delete a message
    const deleteMessageMatch = pathname.match(/^\/api\/messages\/(\d+)$/);
    if (deleteMessageMatch && req.method === 'DELETE') {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = auth.verifyToken(token);

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        const messageId = deleteMessageMatch[1];
        const result = await db2.deleteMessage(messageId);

        if (result) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Message deleted' }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message not found' }));
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

    // API: get all users (for message recipients)
    if (pathname === '/api/users' && req.method === 'GET') {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = auth.verifyToken(token);

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        const users = await db2.getAllUsers(100);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users));
      } catch (error) {
        console.error('Error fetching users:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

    // SEARCH users by name, email, or city (for message recipient search)
    if (pathname === '/api/search-users' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = auth.verifyToken(token);

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      try {
        const searchQuery = parsedUrl.query.q;

        if (!searchQuery) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Search query is required' }));
          return;
        }

        // Parse pagination params (defaults: page 1, maxItems 10)
        const page = parseInt(parsedUrl.query.page) || 1;
        const maxItems = parseInt(parsedUrl.query.maxItems) || 50;

        // Use DB-level search function (searchUsers) and exclude the current user
        const rows = await db2.searchUsers(searchQuery, user.id, page, maxItems);

        // Detect if there is a next page by checking whether we fetched more than maxItems
        const hasNextPage = rows.length > maxItems;
        const users = hasNextPage ? rows.slice(0, maxItems) : rows;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users, pagination: { page, maxItems, hasNextPage } }));
      } catch (error) {
        console.error('Error searching users:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
      return;
    }

  // Match /realtor-view/:id pattern (public view for non-user)
  const realtorViewMatch = pathname.match(/^\/realtor-view\/(\d+)$/);
  if (realtorViewMatch) {
    const filePath = path.join(PUBLIC_DIR, 'realtor-view.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

  // Match /reviews/:id pattern (realtor reviews list)
  const reviewsMatch = pathname.match(/^\/reviews\/(\d+)$/);
  if (reviewsMatch) {
    const filePath = path.join(PUBLIC_DIR, 'reviews.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

  // Match /realtor-reviews pattern (reviews list for realtor)
  if (pathname === '/realtor-reviews') {
    const filePath = path.join(PUBLIC_DIR, 'realtor-reviews.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

    // Match /realtor-my-reviews pattern (my reviews list for logged-in realtor)
    if (pathname === '/realtor-my-reviews') {
      const filePath = path.join(PUBLIC_DIR, 'realtor-my-reviews.html');
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      return;
    }

  // Match /property-view/:id pattern
  const propertyViewMatch = pathname.match(/^\/property-view\/(\d+)$/);
  if (propertyViewMatch) {
    // Serve property-view.html for any /property-view/:id route
    const filePath = path.join(PUBLIC_DIR, 'property-view.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

  // Match /prospect-view/:id pattern (REALTOR ONLY)
  const prospectViewMatch = pathname.match(/^\/prospect-view\/(\d+)$/);
  if (prospectViewMatch) {
    if (!checkRealtorAccess(req, res)) return;
    
    const filePath = path.join(PUBLIC_DIR, 'prospect-view.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

  // Match /realtor-realty-form and /realtor-realty-form/:id (REALTOR ONLY)
  const realtorFormMatch = pathname.match(/^\/realtor-realty-form(?:\/(\d+))?$/);
  if (realtorFormMatch) {
    if (!checkRealtorAccess(req, res)) return;
    
    const filePath = path.join(PUBLIC_DIR, 'realtor-realty-form.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

  // Match /realtor-realty-delete/:id (REALTOR ONLY)
  const realtorDeleteMatch = pathname.match(/^\/realtor-realty-delete\/(\d+)$/);
  if (realtorDeleteMatch) {
    if (!checkRealtorAccess(req, res)) return;
    
    const filePath = path.join(PUBLIC_DIR, 'realtor-realty-delete.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
    return;
  }

  // Static file serving with REALTOR-ONLY PAGE PROTECTION
  let filePath = pathname === '/' ? '/index.html' : pathname;
  
  // Check if this is a realtor-only page
  const realtorOnlyPages = [
    'realtor-home',
    'realtor-prospects',
    'realtor-realty',
    'realtor-messages',
    'realtor-my-reviews',
    'prospect-create',
    'realtor-reviews'
  ];
  
  const isRealtorOnlyPage = realtorOnlyPages.some(page => filePath.includes(page));
  if (isRealtorOnlyPage) {
    if (!checkRealtorAccess(req, res)) return;
  }
  
  // If the path doesn't have an extension, try appending .html
  if (!path.extname(filePath)) {
    filePath += '.html';
  }
  
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
