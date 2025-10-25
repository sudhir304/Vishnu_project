// src/App.js
import React from 'react';
import Hero from './components/Hero_old';
import GardenSection from "./components/GardenSection"; 

//import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
//import About from "./About";

function App() {
  return (
    < Hero/>
  );
}

export default App;
// function App() {
//   return <h1>React is working!</h1>;
// }


//export default App;



















// import React, { useState } from 'react';
// import './App.css';

// function App() {
//   const [prompt, setPrompt] = useState('');
//   const [response, setResponse] = useState('');
//   const [goodResponse, setGoodResponse] = useState(false);

//   const handleSubmit = async () => {
//     const res = await fetch('http://localhost:5000/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ prompt }),
//     });

//     const data = await res.json();
//     setResponse(data.response);
//     setGoodResponse(data.isGood);
//   };

//   const sendEmail = async () => {
//     await fetch('http://localhost:5000/api/send-email', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ content: response }),
//     });
//     alert('Email sent!');
//   };

//   return (
//     <div className="App">
//       <h2>Ollama Chat</h2>
//       <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} cols={50} />
//       <br />
//       <button onClick={handleSubmit}>Send to LLM</button>
//       <div>
//         <h3>Response:</h3>
//         <p>{response}</p>
//         {goodResponse && <button onClick={sendEmail}>Send Email</button>}
//       </div>
//     </div>
//   );
// }

// export default App;
