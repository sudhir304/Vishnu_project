const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const pool = require('./db');
require('./cron/waterRemainder.js'); 

// Load environment variables
dotenv.config({ path: './.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'mistral';

// Utility functions
function isGoodResponse(text) {
  return text.toLowerCase().includes('success') || text.length > 50;
}

function calculateNextWatering(lastWatered, intervalDays) {
  const date = new Date(lastWatered);
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split('T')[0];
}

// Main endpoint: Analyze plant and send email
app.post('/api/analyze', async (req, res) => {
  const { name, location, email, plant_name } = req.body;
  
  console.log('Environment variables:', process.env.EMAIL_USER, process.env.EMAIL_PASS);
  console.log('Request data:', { name, location, email, plant_name });

  const prompt = `You are a Horticulturist. Provide a bulleted response within 200 words for the following queries:
    1) Name of the Plant: "${plant_name}".
    2) In the context of the location "${location}":
       - Frequency of watering to be done?
    3) Space Required for the plant
    4) Harvesting time (when to expect the results)
    5) Useful Composts / fertilizers for the plant
    6) How to best take care of the plant.
    
    Format the response where each point comes as a new paragraph on a new line.`;

  console.log('Calling Ollama with prompt:', prompt);

  try {
    // Step 1: Generate main analysis from Ollama
    const ollamaResponse = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt,
      stream: false,
    });

    const analysis = ollamaResponse.data.response;
    console.log('Analysis received:', analysis);

    // Step 2: Get watering frequency
    let wateringDays = '2-3 times per week';
    try {
      const wateringResponse = await axios.post(OLLAMA_URL, {
        model: MODEL,
        prompt: 'With the above context, what is the watering frequency needed per week?',
        stream: false,
      });
      wateringDays = wateringResponse.data.response;
    } catch (error) {
      console.error('Error getting watering frequency:', error.message);
    }

    // Step 3: Send email
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER || 'patri.sudhir@gmail.com',
          pass: process.env.EMAIL_PASS || 'oedx anhb bwsm gbwi',
        },
      });

      const mailOptions = {
        from: `Plant Care Assistant <${process.env.EMAIL_USER || 'patri.sudhir@gmail.com'}>`,
        to: email,
        subject: `Plant Care Analysis for ${plant_name}`,
        text: analysis,
        html: `
          <h2>Plant Care Analysis</h2>
          <p><strong>Plant:</strong> ${plant_name}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Analysis:</strong></p>
          <div>${analysis.replace(/\n/g, '<br>')}</div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${email}`);
    } catch (error) {
      console.error('Email sending error:', error.message);
    }

    // Step 4: Save to database
    try {
      // Insert user
      const userResult = await pool.query(
        'INSERT INTO users (name, email, location) VALUES ($1, $2, $3) RETURNING *',
        [name, email, location]
      );
      console.log('User created:', userResult.rows[0]);

      // Insert plant
      const wateringIntervalDays = 2;
      const wateringDaysArray = ['Monday', 'Thursday'];
      const description = analysis.substring(0, 200); // Truncate for database

      const plantResult = await pool.query(
        'INSERT INTO plants (plant_name, description, watering_interval_days, watering_days) VALUES ($1, $2, $3, $4) RETURNING *',
        [plant_name, description, wateringIntervalDays, wateringDaysArray]
      );
      console.log('Plant created:', plantResult.rows[0]);

      // Link user and plant
      const userId = userResult.rows[0].id;
      const plantId = plantResult.rows[0].id;
      const lastWatered = new Date().toISOString().split('T')[0];
      const nextWatering = calculateNextWatering(lastWatered, wateringIntervalDays);

      const userPlantResult = await pool.query(
        'INSERT INTO user_plants (user_id, plant_id, last_watered, next_watering) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, plantId, lastWatered, nextWatering]
      );
      console.log('User-plant link created:', userPlantResult.rows[0]);

    } catch (error) {
      console.error('Database error:', error.message);
    }

    res.json({ 
      success: true, 
      message: 'Analysis completed and email sent successfully!', 
      analysis 
    });

  } catch (error) {
    console.error('Main error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌿 Plant Care Server running on port ${PORT}`);
});