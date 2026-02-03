const pg = require('pg');

let pool = null;

function initDB() {
 
  dbpool = new pg.Pool({
    user: 'neondb_owner',
    host: 'ep-floral-bush-a1wec8q2-pooler.ap-southeast-1.aws.neon.tech',
    database: 'neondb',
    password: 'npg_6jAUilzMG1gp',
    port: 5432,
    ssl: { rejectUnauthorized: false },
    //ssl: false // Disable SSL (note: Neon usually requires SSL)
  });

  dbpool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

 // check the connection 

   async function runQuery() {
      try {
        // Get a client from the pool
        const client = await dbpool.connect();

        // Example query
        const res = await client.query('SELECT NOW()');
        console.log('Server time from db:', res.rows[0]);
        console.log('Server time from db:', res.rows[0]);

        // Release client back to pool
        client.release();

      } catch (err) {
        console.error('Query error:', err);
      } finally {
        // Close all pool connections when done
        await dbpool.end();
      }
    }

    runQuery();


  pool = dbpool;
}



function getPool() {
  console.log("get pool");
  console.log(pool);
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
  console.log("get prospects");
  console.log(result.rows);
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


/**** 
 * 
 * 
  const db = require('./db_2.js');
   db.initDB({
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   host: process.env.DB_HOST,
   port: process.env.DB_PORT,
   database: process.env.DB_NAME
  });
*   
*/


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
