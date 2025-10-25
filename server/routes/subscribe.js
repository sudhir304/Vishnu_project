// server/routes/subscribe.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    await pool.query(
      'INSERT INTO subscribers (name, email) VALUES ($1, $2)',
      [name, email]
    );
    res.status(200).json({ message: 'Subscription successful' });
  } catch (err) {
    console.error('Insert error:', err.message);
    res.status(500).json({ error: 'Email already exists or server error' });
  }
});

module.exports = router;
