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
       -wateringDays :  Frequency of watering to be done in a week?
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



    function extractWateringFrequency(analysisText) {
      // Normalize text
      const text = analysisText.toLowerCase();
    
      // Look for patterns like "3-4 days a week", "every 2 days", "once a week", etc.
      let frequencyDays = null;
    
      // Pattern 1: "3-4 days a week"
      const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)\s*days?\s*a\s*week/);
      if (rangeMatch) {
        const avg = (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
        frequencyDays = Math.round(7 / avg); // e.g., 3-4 days/week → water every 2 days
      }
    
      // Pattern 2: "every 2 days"
      const everyMatch = text.match(/every\s+(\d+)\s*days?/);
      if (everyMatch) {
        frequencyDays = parseInt(everyMatch[1]);
      }
    
      // Pattern 3: "once a week"
      if (text.includes("once a week")) {
        frequencyDays = 7;
      }
    
      // Pattern 4: "twice a week"
      if (text.includes("twice a week")) {
        frequencyDays = 3; // roughly every 3 days
      }
    
      // Default fallback (if not found)
      if (!frequencyDays) {
        frequencyDays = 3; // safe default: water every 3 days
      }
    
      return frequencyDays;
    }
    // Step 2: Get watering frequency
    const daysBetweenWatering = extractWateringFrequency(analysis);
    console.log("Water every", daysBetweenWatering, "days.");
    let wateringDays = '2-3 times per week';
    // try {
    //   const wateringResponse = await axios.post(OLLAMA_URL, {
    //     model: MODEL,
    //     prompt: 'With the above context, what is the watering frequency needed per week?',
    //     stream: false,
    //   });
    //   wateringDays = wateringResponse.data.response;
    // } catch (error) {
    //   console.error('Error getting watering frequency:', error.message);
    // }

    console.log("")
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
      let userId;
      
      // Use UPSERT (INSERT ... ON CONFLICT) to handle duplicate emails gracefully
      const userResult = await pool.query(
        `INSERT INTO users (name, email, location) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           location = EXCLUDED.location,
           created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [name, email, location]
      );
      
      userId = userResult.rows[0].id;
      console.log('User processed (created or updated):', userResult.rows[0]);
      console.log("User ID:", userId);

      // Insert or update plant - handle different constraint scenarios
      const wateringIntervalDays = daysBetweenWatering;
      const wateringDaysArray = ['Monday', 'Thursday'];
      const description = analysis.substring(0, 200); // Truncate for database
      const lastWatered = new Date().toISOString().split('T')[0];
      const nextWatering = calculateNextWatering(lastWatered, wateringIntervalDays);

      let plantResult;
      try {
        // First try: Assume unique constraint on (user_id, plant_name)
        plantResult = await pool.query(
          `INSERT INTO plants (user_id, plant_name, watering_days, last_watered, next_watering_date)
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (user_id, plant_name) 
           DO UPDATE SET 
             watering_days = EXCLUDED.watering_days,
             last_watered = EXCLUDED.last_watered,
             next_watering_date = EXCLUDED.next_watering_date,
             created_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [userId, plant_name, wateringDaysArray, lastWatered, nextWatering]
        );
      } catch (conflictError) {
        if (conflictError.message.includes('ON CONFLICT specification')) {
          // Fallback: Try with just plant_name as unique constraint
          try {
            plantResult = await pool.query(
              `INSERT INTO plants (user_id, plant_name, watering_days, last_watered, next_watering_date)
               VALUES ($1, $2, $3, $4, $5) 
               ON CONFLICT (plant_name) 
               DO UPDATE SET 
                 user_id = EXCLUDED.user_id,
                 watering_days = EXCLUDED.watering_days,
                 last_watered = EXCLUDED.last_watered,
                 next_watering_date = EXCLUDED.next_watering_date,
                 created_at = CURRENT_TIMESTAMP
               RETURNING *`,
              [userId, plant_name, wateringDaysArray, lastWatered, nextWatering]
            );
          } catch (secondError) {
            // Final fallback: Check if plant exists first, then insert or update
            const existingPlant = await pool.query(
              'SELECT * FROM plants WHERE user_id = $1 AND plant_name = $2',
              [userId, plant_name]
            );
            
            if (existingPlant.rows.length > 0) {
              // Update existing plant
              plantResult = await pool.query(
                `UPDATE plants SET 
                 watering_days = $3,
                 last_watered = $4,
                 next_watering_date = $5,
                 created_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND plant_name = $2
                 RETURNING *`,
                [userId, plant_name, wateringDaysArray, lastWatered, nextWatering]
              );
            } else {
              // Insert new plant
              plantResult = await pool.query(
                `INSERT INTO plants (user_id, plant_name, watering_days, last_watered, next_watering_date)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [userId, plant_name, wateringDaysArray, lastWatered, nextWatering]
              );
            }
          }
        } else {
          throw conflictError; // Re-throw if it's a different error
        }
      }
      
      console.log('Plant processed (created or updated):', plantResult.rows[0]);

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