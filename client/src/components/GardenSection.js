import React from "react";

//import gardenImg from "../assets/Garden.jpeg"
import gardenImg from '../assets/Garden.jpg';

const GardenSection = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between bg-amber-50 p-10 rounded-2xl shadow-md mt-10">
      {/* Left content */}
      <div className="max-w-lg">
        <h1 className="text-5xl font-extrabold text-green-900 leading-tight">
          GROW YOUR <span className="text-orange-600">GARDEN</span>
        </h1>
        <p className="text-lg text-gray-700 mt-4">
          Let’s plant some seeds and make your space greener. Discover simple
          steps to start your own garden today.
        </p>
        <button className="mt-6 px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition">
          Book Now
        </button>
      </div>

      {/* Right illustration */}
      <div className="mt-10 md:mt-0 md:ml-10">
        <img
          src={gardenImg}
          alt="Watering plants illustration"
          className="w-80 md:w-96"
        />
      </div>
    </section>
  );
};

export default GardenSection;