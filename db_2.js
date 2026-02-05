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
    console.log('Getting user by username:', username);
    console.log('Getting user by username:', username);
    const p = getPool();
    const res = await p.query('SELECT id, username, password, role, fullname, email, address FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error in getUserByUsername:', err);
    throw err;
  }
  const p = getPool();
  const res = await p.query('SELECT id, username, password, role, fullname, email, phone, address FROM users WHERE username = $1', [username]);
  return res.rows[0] || null;
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

async function createProspect(fullname, email = null, status = 'Active', notes = '', realtor_id = 1) {
  const p = getPool();

  // // Create user record for buyer
  // // const userRes = await p.query(
  // //   'INSERT INTO users (username, password, fullname, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, fullname, email',
  // //   [email, 'prospect_password', fullname, email, 'buyer']
  // // );
  // const userId = userRes.rows[0].id;

  // const prospectRes = await p.query(
  //   'INSERT INTO prospects (userid, realtor, status, notes) VALUES ($1, $2, $3, $4) RETURNING id, userid, realtor, status, notes, created_at, updated_at',
  //   [userId, realtor_id, status, notes]
  // );

  // const prospect = prospectRes.rows[0];
  // return {
  //   prospect_id: prospect.id,
  //   id: prospect.id,
  //   fullname: userRes.rows[0].fullname,
  //   email: userRes.rows[0].email,
  //   status: prospect.status,
  //   notes: prospect.notes,
  //   userid: prospect.userid,
  //   realtor: prospect.realtor,
  //   prospect_created_at: prospect.created_at,
  //   prospect_updated_at: prospect.updated_at
  // };
}

async function linkUserProspect(userId, notes = '', status = 'Active', realtorId = 1) {
  const p = getPool();

  const userRes = await p.query('SELECT id, fullname, email, address FROM users WHERE id = $1', [userId]);
  if (!userRes.rows[0]) throw new Error('User not found');
  const user = userRes.rows[0];

  const prospectRes = await p.query(
    'INSERT INTO prospects (userid, realtor, status, notes) VALUES ($1, $2, $3, $4) RETURNING id, userid, realtor, status, notes, created_at, updated_at',
    [userId, realtorId, status, notes]
  );

  const prospect = prospectRes.rows[0];
  return {
    prospect_id: prospect.id,
    id: prospect.id,
    fullname: user.fullname,
    email: user.email,
    status: prospect.status,
    notes: prospect.notes,
    userid: prospect.userid,
    realtor: prospect.realtor,
    prospect_created_at: prospect.created_at,
    prospect_updated_at: prospect.updated_at
  };
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
        r.created_at,
        u.fullname AS realtor_fullname,
        u.email AS realtor_email
      FROM realty r
      LEFT JOIN users u ON r.realtor = u.id
      ORDER BY r.created_at DESC`
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
        u.fullname AS realtor_fullname,
        u.email AS realtor_email
      FROM realty r
      LEFT JOIN users u ON r.realtor = u.id
      WHERE r.id = $1`,
      [id]
    );
  return result.rows[0] || null;
}



async function getProspectById(id) {
  const p = getPool();
  const res = await p.query(
    `SELECT p.id AS prospect_id, p.status, p.created_at AS prospect_created_at, p.updated_at AS prospect_updated_at, p.notes, p.realtor,
      u.id AS user_id, u.username, u.fullname, u.email, u.role, u.created_at AS user_created_at
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
  createProspect,
  linkUserProspect,
  getProspects,
  getRealties,
  getRealtyById,
  deleteProspect,
  closeDB
};
