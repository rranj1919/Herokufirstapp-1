// Import node-postgres module to interact with heroku postgres db
const { Pool } = require('pg');

const pool = new Pool({
    // Connection string retrieved from heroku config variable DATABASE_URL
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

module.exports = {
    pool
}