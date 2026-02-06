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

async function getReviewsByRealtorId(realtorId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT r.id, r.realtor_id, r.buyer_id, r.rating, r.review, r.created_at,
            u.fullname AS buyer_name, u.image AS buyer_image
     FROM reviews r
     LEFT JOIN users u ON r.buyer_id = u.id
     WHERE r.realtor_id = $1
     ORDER BY r.created_at DESC`,
    [realtorId]
  );
  return result.rows || [];
}

async function getMessagesByUserId(userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
        m.id AS message_id,
        m.title,
        m.content,
        m.created_at,
        s.id AS sender_id,
        s.fullname AS sender_fullname,
        s.email AS sender_email,
        s.role AS sender_role,
        r.id AS receiver_id,
        r.fullname AS receiver_fullname,
        r.email AS receiver_email,
        r.role AS receiver_role
     FROM messages m
     JOIN users s ON m.message_from = s.id
     JOIN users r ON m.message_to = r.id
     WHERE m.message_to = $1
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return result.rows || [];
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
  createProspect,
  linkUserProspect,
  getProspects,
  getProspectById,
  getRealties,
  getRealtiesByRealtor,
  getRealtyById,
  createRealty,
  updateRealty,
  deleteRealty,
  getRealtors,
  getAllUsers,
  getUserById,
  deleteProspect,
  createReview,
  getReviewsByRealtorId,
  getMessagesByUserId,
  createMessage,
  deleteMessage,
  closeDB
};
