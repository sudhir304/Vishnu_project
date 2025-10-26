// server/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Plant_db',
  password: 'SUDHIR_pg',
  port: 5432,
});

module.exports = pool;
