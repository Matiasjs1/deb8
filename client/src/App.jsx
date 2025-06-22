import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from './pages/Home.jsx'
import LandingPage from './pages/LandingPage.jsx'

function App() {

  return (
     <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landingPage" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;