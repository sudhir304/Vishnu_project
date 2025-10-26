const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
//const pool = require('./db');
const  cron  = require("node-cron");

const pool = require('../db');

dotenv.config();
//const { Pool } = pkg;

// ✅ Connect to PostgreSQL
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL ||,
//   ssl: { rejectUnauthorized: false }
// });

// ✅ Create mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || 'patri.sudhir@gmail.com',
    pass: process.env.EMAIL_PASS || 'oedx anhb bwsm gbwi',
  }
});

// ✅ The cron job (runs every day at 8 AM)
cron.schedule("15 23 * * *", async () => {
  console.log("🌿 Running daily watering reminder...");

  try {
    // Fetch plants that need watering today
    const query = `
      SELECT u.email, u.name AS user_name, p.plant_name, up.next_watering
      FROM user_plants up
      JOIN users u ON u.id = up.user_id
      JOIN plants p ON p.id = up.plant_id
      WHERE up.next_watering = CURRENT_DATE;
    `;

    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      console.log("No watering tasks for today.");
      return;
    }

    // Send mail to each user
    for (const row of rows) {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'patri.sudhir@gmail.com',
        to: row.email,
        subject: `🌱 Water your ${row.plant_name} plant today!`,
        text: `Hi ${row.user_name},\n\nIt's time to water your ${row.plant_name} Plant today!\n\nHappy gardening! 🌿`
      };

      await transporter.sendMail(mailOptions);
      console.log(`📨 Reminder sent to ${row.email} for ${row.plant_name}`);

      try{
        console.log(" 🌱 updating  the  next watering date ");
        await pool.query(
        `UPDATE user_plants
         SET last_watered = CURRENT_DATE,
             next_watering = CURRENT_DATE + INTERVAL '1 day' * p.watering_interval_days
         FROM plants p
         WHERE p.id = user_plants.plant_id
         AND user_plants.next_watering = CURRENT_DATE;`
      );
    
      }catch (err) {
        console.error("❌ Error in watering reminder job:", err);
      }
    }
  } catch (err) {
    console.error("❌ Error in watering reminder job:", err);
  }

 
});
// await pool.query(
//     `UPDATE user_plants
//      SET last_watered = CURRENT_DATE,
//          next_watering = CURRENT_DATE + INTERVAL '1 day' * p.watering_interval_days
//      FROM plants p
//      WHERE p.id = user_plants.plant_id
//      AND user_plants.next_watering = CURRENT_DATE;`
//   );