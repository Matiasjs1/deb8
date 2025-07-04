import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from './pages/Home.jsx'
import LandingPage from './pages/LandingPage.jsx'

function App() {


  return (
     <>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </>
    
  );
}

export default App;