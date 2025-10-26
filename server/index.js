


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

//const subscribeRoute = require('./routes/subscribe');

const app = express();
dotenv.config({ path: "./server/.env" });

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
  console.log (process.env.EMAIL_USER  ,' ********^^&&&&&',process.env.EMAIL_PASS);

  //const { prompt } = req.body;
 console.log("  ****************  ");
  const prompt = ` You are an Horticulturist. Provide a  bulleted response with in 200 words for the following  queries 
                   1) Name of the Plant  : "${name}".
                    
                   2)in the context of the location "${location}".
                   For the "${location}", frequency of to water to be done?
                   3)Space Required  for the plant 
                   4)Harvesting  time (when to expect the results),
                   5)Useful Composts / fertilizers for the plant
                   6) how to best take take of the plant.
                   And Format the response where  each point  is coming  as a new paragraph in a  new line 
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
    try {
      // 1️⃣ Create transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          // user: process.env.EMAIL_USER,
          // pass: process.env.EMAIL_PASS,
           user: 'patri.sudhir@gmail.com',
           pass: '', // this needs to  be added 
        },
      });

        console.log(transporter);
      const mailOptions = {
        //from: `"My App" <${process.env.EMAIL_USER}>`,
        from: `My App patri.sudhir@gmail.com`,
        to: email, // or use req.body.email
        subject: `New message from SUDHIR `,
        text: analysis,
        html: `<p><b>From:</b> SUDHIR  (${email})</p><p>${analysis}</p>`,
      };

    await transporter.sendMail(mailOptions);
    }catch(error){
      console.error("❌ 1 Error:", error.message);
    }

    //await transporter.sendMail(mailOptions);
    //res.json({ message: analysis });
    console.log(`📧 Email sent to ${email}`);
    res.json({ message: analysis });
    //res.json({ success: true, message: "Email sent successfully!", analysis });
  } 
  catch (error) {
    console.error("❌ 2 Error:", error.message);
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
