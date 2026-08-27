const db = require('../config/db');

const testDatabaseConnection = async () => {
  console.log('--- Testing PostgreSQL Connection for Ovizatri ---');
  try {
    const res = await db.query('SELECT NOW() as current_time, current_database() as database_name');
    console.log('Database Connected Successfully!');
    console.log('Current DB Time:', res.rows[0].current_time);
    console.log('Connected Database:', res.rows[0].database_name);

    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available Tables in DB:', tablesRes.rows.map((r) => r.table_name));
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Please verify DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in your .env file.');
  } finally {
    process.exit(0);
  }
};

testDatabaseConnection();
