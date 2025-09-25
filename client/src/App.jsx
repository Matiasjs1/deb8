import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from './pages/Home.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Profile from './pages/Profile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DebateRoom from './pages/DebateRoom.jsx'
import Settings from './pages/Settings.jsx'
import { LocaleProvider } from './i18n/LocaleProvider.jsx'

function App() {


  return (
     <>
      <LocaleProvider>
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
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/debates/:id" element={
              <ProtectedRoute>
                <DebateRoom />
              </ProtectedRoute>
            } />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </LocaleProvider>
    </>
    
  );
}

export default App;