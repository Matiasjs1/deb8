import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from './pages/Home.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Profile from './pages/Profile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {


  return (
     <>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </>
    
  );
}

export default App;