// src/components/Hero.js
import React , { useState }  from 'react';
import './Hero.css';
import plantImg from '../assets/Plant.jpeg';
//import gardenImg from "../assets/Garden.jpeg" // You’ll need to save the plant image here

import axios from 'axios';
// import { useNavigate } from "react-router-dom";


const Hero = () => {

  const [formData, setFormData] = useState({ name: '', email: '' });


// const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/analyze', formData);
      alert(res.data.message);
      setFormData({ name: '', email: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    }
  };

  // const goToAbout = () => {
  //   navigate("/about");
  // };

  return (
    <div className="hero">
      <nav className="navbar">
        <div className="logo">Plant Shop</div>
        <ul className="nav-links">
          <li className="active">Home</li>
          <li>Event</li>
          <li >About</li>
          <li>Contact Us</li>
        </ul>
      </nav>

      <div className="hero-content">
        <div className="text-section">
          <h1>
            Garden <br /> Of Dream
          </h1>
          <p className="tagline">life is a garden</p>

          <form className="input-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name........"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email........"
          value={formData.email}
          onChange={handleChange}
        />
        <button type="submit">Send</button>
      </form>
        </div>

        <div className="image-section">
          <img src={plantImg} alt="Plant" />
          <div className="plant-info">
            <h3>Plant Name</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
            </p>
            <button className="read-more">Read More</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
