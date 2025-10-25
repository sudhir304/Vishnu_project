// src/components/About.js
import React , { useState }  from 'react';
import './Hero.css';
import plantImg from '../assets/Plant.jpeg';
//import gardenImg from "../assets/Garden.jpeg" // You’ll need to save the plant image here

import axios from 'axios';
import { name } from 'mailer/vendor/mustache';


const Hero = () => {
  const [screen, setScreen] = useState('about'); 
  //const [form, setForm] = useState({ name: "", location: "", email: "" });
//   const [message, setMessage] = useState("");
//   const [reply, setReply] = useState("");

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("Processing... please wait");

//     try {
//       alert (form.name);
//       const res = await axios.post("http://localhost:5000/api/analyze", form);
//       //setMessage(res.data.message + "\n\n" + res.data.analysis);
//       setReply(res.data.reply);
//     } catch (err) {
//       setMessage("Error sending email. Please try again.");
//     }
//   };
  return (
    <div className="about">
      <nav className="navbar">
        <div className="logo">Plant Shop</div>
        <ul className="nav-links">
          <li onClick={() => setScreen('home')}>Home</li>
          <li>Event</li>
          <li className='active'>About</li>
           {/* ?{ /<button >Home</button> */} */
        {/* <button >About</button> */}

          <li  >Contact Us</li>
        </ul>
      </nav>

      <div className="hero-content">
        <div className="text-section">
          <h1>
            ABOUT the GARDEN DETAILS
          </h1>
          <p className="tagline">life is a garden</p>

 
        </div>

        <div className="image-section">
          <img src={plantImg} alt="Plant" />
          <div className="plant-info">
            <h3>{name}</h3>
            <p>
              {reply}
              {/* Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore. */}
            </p>
            <button className="read-more">Read More</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
