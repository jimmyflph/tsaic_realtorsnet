const db2 = require('../db_2.js');

async function run() {
  try {
    db2.initDB();
    // wait a moment for pool to initialise
    await new Promise(r => setTimeout(r, 1000));
    const user = await db2.createUser('testrealtor', 'Password123!', 'realtor');
    console.log('Created realtor:', user);
    process.exit(0);
  } catch (err) {
    console.error('Error creating realtor:', err.message || err);
    process.exit(1);
  }
}

run();
