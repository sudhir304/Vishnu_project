// server/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'sudhir',
  host: 'localhost',
  database: 'plantshop',
  password: 'sudhir@001',
  port: 5432,
});

module.exports = pool;
