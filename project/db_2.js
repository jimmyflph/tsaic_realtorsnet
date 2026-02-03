const pg = require('pg');

let pool = null;

function initDB(config) {
  pool = new pg.Pool(config);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return pool;
}

async function getUserByUsername(username) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id, username, password, role FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
}

async function getProspects() {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id, name, email, phone, status FROM prospects ORDER BY id'
  );
  return result.rows;
}

async function getProspectById(id) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id, name, email, phone, status FROM prospects WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function createProspect(name, email, phone, status = 'Active') {
  const pool = getPool();
  const result = await pool.query(
    'INSERT INTO prospects (name, email, phone, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, phone, status]
  );
  return result.rows[0];
}

async function updateProspect(id, name, email, phone, status) {
  const pool = getPool();
  const result = await pool.query(
    'UPDATE prospects SET name = $1, email = $2, phone = $3, status = $4 WHERE id = $5 RETURNING *',
    [name, email, phone, status, id]
  );
  return result.rows[0] || null;
}

async function deleteProspect(id) {
  const pool = getPool();
  const result = await pool.query(
    'DELETE FROM prospects WHERE id = $1 RETURNING id',
    [id]
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
  getProspects,
  getProspectById,
  createProspect,
  updateProspect,
  deleteProspect,
  closeDB
};
