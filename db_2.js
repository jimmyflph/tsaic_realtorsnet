const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;

function initDB() {
  if (pool) return;

  pool = new Pool({
    user: 'neondb_owner',
    host: 'ep-floral-bush-a1wec8q2-pooler.ap-southeast-1.aws.neon.tech',
    database: 'neondb',
    password: 'npg_6jAUilzMG1gp',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  pool.on('error', (err) => console.error('Unexpected error on idle client', err));
}

function getPool() {
  if (!pool) throw new Error('Database not initialized. Call initDB first.');
  return pool;
}

async function getUserByUsername(username) {
  try {
    console.log('Getting user by username:', username);
    const p = getPool();
    const res = await p.query('SELECT id, username, password, role, fullname, email, address FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error in getUserByUsername:', err);
    throw err;
  }
}

async function createUser(username, password, role = 'realtor') {
  const p = getPool();
  const hashed = await bcrypt.hash(password, 10);
  const res = await p.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role', [username, hashed, role]);
  return res.rows[0];
}

async function searchBuyers(searchQuery) {
  const p = getPool();
  const q = `%${searchQuery}%`;
  const res = await p.query(
    `SELECT id, fullname, email, address 
     FROM users
     WHERE role = 'buyer' AND (
       LOWER(fullname) LIKE LOWER($1) OR
       LOWER(email) LIKE LOWER($1) OR
       LOWER(address) LIKE LOWER($1)
     )
     LIMIT 50`,
    [q]
  );
  return res.rows || [];
}

async function searchBuyersExcludeProspects(searchQuery, realtorId) {
  const p = getPool();
  const q = `%${searchQuery}%`;

  const prospectRes = await p.query('SELECT DISTINCT userid FROM prospects WHERE realtor = $1', [realtorId]);
  const prospectUserIds = prospectRes.rows.map(row => row.userid);

  const buyersRes = await p.query(
    `SELECT id, fullname, email, address 
     FROM users
     WHERE role = 'buyer' AND (
       LOWER(fullname) LIKE LOWER($1) OR
       LOWER(email) LIKE LOWER($1) OR
       LOWER(address) LIKE LOWER($1)
     )
     LIMIT 50`,
    [q]
  );

  const filteredBuyers = buyersRes.rows.filter(buyer => !prospectUserIds.includes(buyer.id));
  return filteredBuyers;
}

// Search all users (by name, email, or address) with optional exclusion of a user id
// Supports simple pagination via page and maxItems. Returns up to maxItems+1 rows
// so caller can detect whether there is a next page.
async function searchUsers(searchQuery, excludeUserId = null, page = 1, maxItems = 50) {
  const pool = getPool();
  const q = `%${searchQuery}%`;
  const offset = Math.max(0, (page - 1)) * Math.max(1, maxItems);
  const fetchLimit = Math.max(1, maxItems) + 1; // fetch one extra to detect next page

  let sql;
  let params;

  if (excludeUserId) {
    sql = `SELECT id, fullname, email, address
           FROM users
           WHERE id <> $4 AND (LOWER(fullname) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(address) LIKE LOWER($1))
           ORDER BY fullname NULLS LAST
           LIMIT $2 OFFSET $3`;
    params = [q, fetchLimit, offset, excludeUserId];
  } else {
    sql = `SELECT id, fullname, email, address
           FROM users
           WHERE (LOWER(fullname) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(address) LIKE LOWER($1))
           ORDER BY fullname NULLS LAST
           LIMIT $2 OFFSET $3`;
    params = [q, fetchLimit, offset];
  }

  const res = await pool.query(sql, params);
  return res.rows || [];
}

async function createProspect(fullname, email = null, status = 'Active', notes = '', realtor_id = 1) {
  const p = getPool();
  const res = await p.query(
    'INSERT INTO prospects (userid, notes, status, realtor) VALUES ($1, $2, $3, $4) RETURNING id, userid, notes, status, realtor, created_at, updated_at',
    [null, notes, status, realtor_id]
  );
  return res.rows[0] || null;
}

async function linkUserProspect(userId, notes = '', status = 'Active', realtorId = 1) {
  const p = getPool();
  const res = await p.query(
    'INSERT INTO prospects (userid, notes, status, realtor) VALUES ($1, $2, $3, $4) RETURNING id, userid, notes, status, realtor, created_at, updated_at',
    [userId, notes, status, realtorId]
  );
  return res.rows[0];
}

async function getProspects(realtorId = 1, page = 1, maxItems = 10) {
  const p = getPool();
  const offset = (page - 1) * maxItems;
  const countRes = await p.query('SELECT COUNT(*) as total FROM prospects WHERE realtor = $1', [realtorId]);
  const totalRecords = parseInt(countRes.rows[0].total || '0', 10);

  const res = await p.query(
    `SELECT p.id AS prospect_id, p.status, p.created_at AS prospect_created_at, p.updated_at AS prospect_updated_at, p.notes, p.realtor,
      u.id AS user_id, u.username, u.fullname, u.email, u.role, u.created_at AS user_created_at
     FROM prospects p
     INNER JOIN users u ON p.userid = u.id
     WHERE p.realtor = $1
     ORDER BY p.id
     LIMIT $2 OFFSET $3`,
    [realtorId, maxItems, offset]
  );

  return { prospects: res.rows, totalRecords };
}

async function getRealties() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 
      r.id, 
      r.title, 
      r.description, 
      r.isrental, 
      r.price, 
      r.amenities, 
      r.address, 
      r.realtor,
      r.images,
      r.created_at,
      u.fullname AS realtor_fullname,
      u.email AS realtor_email,
      u.image AS realtor_image
    FROM realty r
    LEFT JOIN users u ON r.realtor = u.id
    ORDER BY r.created_at DESC`
  );
  return result.rows;
}

async function searchRealties(q, isrental, page = 1, limit = 12) {
  const pool = getPool();
  const offset = (page - 1) * limit;

  // Build dynamic WHERE clauses
  const where = [];
  const params = [];
  let idx = 1;

  if (q) {
    where.push(`(r.title ILIKE $${idx} OR r.description ILIKE $${idx} OR r.address ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }

  if (isrental !== undefined && isrental !== null && isrental !== '') {
    // Expect 'true' or 'false' (string) or numeric 1/0
    const val = (String(isrental).toLowerCase() === 'true' || String(isrental) === '1') ? true : false;
    where.push(`r.isrental = $${idx}`);
    params.push(val);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // total count
  const countSql = `SELECT COUNT(*) as total FROM realty r ${whereSql}`;
  const countRes = await pool.query(countSql, params);
  const totalRecords = parseInt(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  // results
  const resultsSql = `SELECT 
      r.id, r.title, r.description, r.isrental, r.price, r.amenities, r.address, r.realtor, r.images, r.created_at,
      u.fullname AS realtor_fullname, u.email AS realtor_email, u.image AS realtor_image
    FROM realty r
    LEFT JOIN users u ON r.realtor = u.id
    ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}`;

  params.push(limit, offset);

  const res = await pool.query(resultsSql, params);
  return {
    realties: res.rows || [],
    pagination: { page, limit, totalRecords, totalPages }
  };
}

async function getRealtiesByRealtor(realtorId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 
      r.id, 
      r.title, 
      r.description, 
      r.isrental, 
      r.price, 
      r.amenities, 
      r.address, 
      r.realtor,
      r.images,
      r.created_at,
      u.fullname AS realtor_fullname,
      u.email AS realtor_email,
      u.image AS realtor_image
     FROM realty r
     LEFT JOIN users u ON r.realtor = u.id
     WHERE r.realtor = $1
     ORDER BY r.created_at DESC`,
    [realtorId]
  );
  return result.rows;
}

async function getRealtyById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 
      r.id, 
      r.title, 
      r.description, 
      r.isrental, 
      r.price, 
      r.amenities, 
      r.address, 
      r.created_at,
      r.realtor,
      r.images,
      u.fullname AS realtor_fullname,
      u.email AS realtor_email,
      u.image AS realtor_image
    FROM realty r
    LEFT JOIN users u ON r.realtor = u.id
    WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function createRealty(title, description, isrental, price, amenities, address, realtorId = 1, images = []) {
  const pool = getPool();
  const imagesCsv = Array.isArray(images) ? images.join(',') : (images || '');
  const result = await pool.query(
    `INSERT INTO realty (title, description, isrental, price, amenities, address, realtor, images) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING id, title, description, isrental, price, amenities, address, realtor, images, created_at`,
    [title, description, isrental, price, amenities, address, realtorId, imagesCsv]
  );
  return result.rows[0] || null;
}

async function updateRealty(id, title, description, isrental, price, amenities, address, images = []) {
  const pool = getPool();
  const imagesCsv = Array.isArray(images) ? images.join(',') : (images || '');
  const result = await pool.query(
    `UPDATE realty 
     SET title = $1, description = $2, isrental = $3, price = $4, amenities = $5, address = $6, images = $7
     WHERE id = $8 
     RETURNING id, title, description, isrental, price, amenities, address, realtor, images, created_at`,
    [title, description, isrental, price, amenities, address, imagesCsv, id]
  );
  return result.rows[0] || null;
}

async function deleteRealty(id) {
  const pool = getPool();
  const result = await pool.query(
    'DELETE FROM realty WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
}

async function getRealtors(limit = 100) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, username, fullname, email, address, image, created_at
     FROM users
     WHERE role = 'realtor'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows || [];
}

async function getAllUsers(limit = 100) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, username, fullname, email, address, image, created_at, role
     FROM users
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows || [];
}

async function getUserById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, username, fullname, email, address, role, image, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function getProspectById(id) {
  const p = getPool();
  const res = await p.query(
    `SELECT p.id AS prospect_id, p.status, p.created_at AS prospect_created_at, p.updated_at AS prospect_updated_at, p.notes, p.realtor, p.userid,
      u.id AS user_id, u.username, u.fullname, u.email, u.address, u.role, u.created_at AS user_created_at
     FROM prospects p
     INNER JOIN users u ON p.userid = u.id
     WHERE p.id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

async function deleteProspect(id) {
  const p = getPool();
  const res = await p.query('DELETE FROM prospects WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
}

async function checkReviewExists(realtorId, buyerId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id FROM reviews WHERE realtor_id = $1 AND buyer_id = $2`,
    [realtorId, buyerId]
  );
  return result.rows.length > 0;
}

async function createReview(realtorId, buyerId, rating, reviewText) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO reviews (realtor_id, buyer_id, rating, review)
     VALUES ($1, $2, $3, $4)
     RETURNING id, realtor_id, buyer_id, rating, review, created_at`,
    [realtorId, buyerId, rating, reviewText]
  );
  return result.rows[0] || null;
}


async function getReviewsByRealtorId(realtorId, page = 1, limit = 10) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM reviews WHERE realtor_id = $1`,
    [realtorId]
  );
  const totalRecords = parseInt(countResult.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalRecords / limit);
  
  // Get paginated results
  const result = await pool.query(
    `SELECT r.id, r.realtor_id, r.buyer_id, r.rating, r.review, r.created_at,
            u.fullname AS buyer_name, u.image AS buyer_image
     FROM reviews r
     LEFT JOIN users u ON r.buyer_id = u.id
     WHERE r.realtor_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [realtorId, limit, offset]
  );
  
  return {
    reviews: result.rows || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages
    }
  };
}

async function getMessagesByUserId(userId, page = 1, limit = 10) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM messages WHERE message_to = $1`,
    [userId]
  );
  const totalRecords = parseInt(countResult.rows[0].total) || 0;
  const totalPages = Math.ceil(totalRecords / limit);
  
  // Get paginated results
  const result = await pool.query(
    `SELECT
        m.id AS message_id,
        m.title,
        m.content,
        m.created_at,
        s.id AS sender_id,
        s.username AS sender_username,
        s.fullname AS sender_fullname,
        s.email AS sender_email,
        s.role AS sender_role,
        r.id AS receiver_id,
        r.username AS receiver_username,
        r.fullname AS receiver_fullname,
        r.email AS receiver_email,
        r.role AS receiver_role
     FROM messages m
     JOIN users s ON m.message_from = s.id
     JOIN users r ON m.message_to = r.id
     WHERE m.message_to = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  return {
    messages: result.rows || [],
    pagination: {
      page: page,
      limit: limit,
      totalRecords: totalRecords,
      totalPages: totalPages
    }
  };
}

async function getMessagesSentByUserId(userId, page = 1, limit = 10) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM messages WHERE message_from = $1`,
    [userId]
  );
  const totalRecords = parseInt(countResult.rows[0].total) || 0;
  const totalPages = Math.ceil(totalRecords / limit);
  
  // Get paginated results
  const result = await pool.query(
    `SELECT
        m.id AS message_id,
        m.title,
        m.content,
        m.created_at,
        s.id AS sender_id,
        s.username AS sender_username,
        s.fullname AS sender_fullname,
        s.email AS sender_email,
        s.role AS sender_role,
        r.id AS receiver_id,
        r.username AS receiver_username,
        r.fullname AS receiver_fullname,
        r.email AS receiver_email,
        r.role AS receiver_role
     FROM messages m
     JOIN users s ON m.message_from = s.id
     JOIN users r ON m.message_to = r.id
     WHERE m.message_from = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  return {
    messages: result.rows || [],
    pagination: {
      page: page,
      limit: limit,
      totalRecords: totalRecords,
      totalPages: totalPages
    }
  };
}

async function createMessage(messageFrom, messageTo, title, content) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO messages (message_from, message_to, title, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, message_from, message_to, title, content, created_at`,
    [messageFrom, messageTo, title, content]
  );
  return result.rows[0] || null;
}

async function deleteMessage(messageId) {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM messages WHERE id = $1 RETURNING id`,
    [messageId]
  );
  return result.rows[0] || null;
}

async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  initDB,
  getPool,
  getUserByUsername,
  createUser,
  searchBuyers,
  searchBuyersExcludeProspects,
  searchUsers,
  createProspect,
  linkUserProspect,
  getProspects,
  getProspectById,
  getRealties,
  searchRealties,
  getRealtiesByRealtor,
  getRealtyById,
  createRealty,
  updateRealty,
  deleteRealty,
  getRealtors,
  getAllUsers,
  getUserById,
  deleteProspect,
  checkReviewExists,
  createReview,
  getReviewsByRealtorId,
  getMessagesByUserId,
  getMessagesSentByUserId,
  createMessage,
  deleteMessage,
  closeDB
};
