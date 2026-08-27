const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const seedAdmin = require('./seedAdmin');

const initDb = async () => {
  console.log('--- Initializing Ovizatri Database Tables ---');
  try {
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(sql);
      console.log('All schema tables and constraints created successfully.');
    } else {
      console.log('database_setup.sql file not found, skipping schema creation.');
    }

    // Seed default admin
    await seedAdmin();
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  } finally {
    process.exit(0);
  }
};

initDb();
