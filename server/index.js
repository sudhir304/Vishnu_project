const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
//const subscribeRoute = require('./routes/subscribe');

const app = express();
app.use(cors());
app.use(express.json());
//app.use('/api/subscribe', subscribeRoute);

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'mistral'; // or whatever model you have running

// Dummy "response quality" check function
function isGoodResponse(text) {
  return text.toLowerCase().includes("success") || text.length > 50;
}

// Endpoint: Chat with Ollama
app.post("/api/analyze", async (req, res) => {
  const { name, location, email } = req.body;

  //const { prompt } = req.body;
 console.log("  ****************  ");
  const prompt = ` You are an Horticulturist. Provide a short description of the plant : "${name}".
                    Is it an indoor  or outdoor plant?
                   in the context of the location "${location}".
                   For the "${location}", how many time to water?
                   how to best take take of the plant 
                   `;
  console.log( "**** calling  Ollama with  prompt ", prompt);

  try {
    // Step 1: Generate response from Ollama model
    const ollamaResponse = await axios.post(OLLAMA_URL, {
      model: "mistral", // or any other model you have
      prompt,
      stream: false,
    });

   analysis =  ollamaResponse.data.response;
    console.log("&&&&&&&&&&&&&&&b   analysis::",analysis);
    // Step 2: Send email with Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "patri.sudhir@gmail.com",
        pass: "PATRIrao@304",
      },
    });

    const mailOptions = {
      from: "patri.sudhir@gmail.com",
      to: "sudheendra.patri@gmail.com",
      subject: `Details about the name "${name}"`,
      text: analysis,
    };

    //await transporter.sendMail(mailOptions);
    res.json({ reply: analysis });
    console.log(`📧 Email sent to ${email}`);
    res.json({ success: true, message: "Email sent successfully!", analysis });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Endpoint: Send email
// app.post('/api/send-email', async (req, res) => {
//   const { content } = req.body;

//   const transporter = nodemailer.createTransport({
//     service: 'gmail', // or SMTP provider
//     auth: {
//       user: 'patri.sudhir@gmail.com',
//       pass: 'PATRIrao@304' // use app password if 2FA enabled
//     }
//   });

//   const mailOptions = {
//     from: 'patri.sudhir@gmail.com',
//     to: 'sudheendra.patri@gmail.com',
//     subject: 'LLM Generated Content',
//     text: content,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.json({ status: 'Email sent' });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Email sending failed' });
//   }
// });

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
