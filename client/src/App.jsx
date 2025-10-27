import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LocaleProvider } from './i18n/LocaleProvider.jsx'

// Lazy loading de componentes para mejorar el rendimiento
const Home = lazy(() => import('./pages/Home.jsx'))
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'))
const DebateRoom = lazy(() => import('./pages/DebateRoom.jsx'))
const VoiceDebateRoom = lazy(() => import('./pages/VoiceDebateRoom.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))

function App() {


  return (
     <>
      <LocaleProvider>
        <BrowserRouter>
          <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white'}}>Cargando...</div>}>
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
              <Route path="/voice-debates/:id" element={
                <ProtectedRoute>
                  <VoiceDebateRoom />
                </ProtectedRoute>
              } />
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LocaleProvider>
    </>
    
  );
}

export default App;