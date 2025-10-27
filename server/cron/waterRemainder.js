const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cron = require('node-cron');
const pool = require('../db');

// Load environment variables
dotenv.config();

// Create mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'patri.sudhir@gmail.com',
    pass: process.env.EMAIL_PASS || 'oedx anhb bwsm gbwi',
  }
});

// Helper function to group plants by user
const groupByUser = (rows) => {
  const grouped = {};
  rows.forEach(row => {
    const userId = row.user_id;
    if (!grouped[userId]) {
      grouped[userId] = {
        name: row.user_name,
        email: row.user_email,
        location: row.location,
        plants: []
      };
    }
    grouped[userId].plants.push(row.plant_name);
  });
  return Object.values(grouped);
};

// The cron job (runs every day at 11:15 PM)
cron.schedule('07 11 * * *', async () => {
  console.log('🌿 Running daily watering reminder...');

  try {
    // Get plants that need watering today
    const result = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.location,
        p.plant_name,
        p.next_watering_date
      FROM 
        users u
      JOIN 
        plants p ON u.id = p.user_id
      WHERE 
        p.next_watering_date = CURRENT_DATE
    `);

    if (result.rows.length === 0) {
      console.log('🌿 No plants need watering today.');
      return;
    }

    // Group plants by user
    const users = groupByUser(result.rows);

    // Send emails to users
    for (const user of users) {
      const mailBody = `
        <h2>Hello ${user.name},</h2>
        <p>The following plants need watering today:</p>
        <ul>
          ${user.plants.map(plant => `<li>${plant}</li>`).join('')}
        </ul>
        <p>Happy gardening! 🌱</p>
      `;

      await transporter.sendMail({
        from: `"Plant Reminder" <${process.env.EMAIL_USER || 'patri.sudhir@gmail.com'}>`,
        to: user.email,
        subject: '🌿 Watering Reminder for Your Plants',
        html: mailBody
      });

      console.log(`✅ Email sent to ${user.email}`);
    }

    // Update next watering dates for plants that were reminded
    console.log('🌱 Updating next watering dates...');
    await pool.query(`
      UPDATE plants
      SET next_watering_date = CURRENT_DATE + INTERVAL '2 days'
      WHERE next_watering_date = CURRENT_DATE
    `);

    console.log('✅ Watering reminder job completed successfully');

  } catch (err) {
    console.error('❌ Error in watering reminder job:', err);
  }
});

console.log('📅 Water reminder cron job scheduled for 11:15 PM daily');