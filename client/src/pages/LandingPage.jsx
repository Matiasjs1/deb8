import { useState } from "react"
import "./LandingPage.css"
import LogInModal from "../components/LogInModal"
import RegisterModal from "../components/RegisterModal"


function LandingPage() {
  const [showLogIn, setShowLogIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const openLogIn = () => {
    setShowRegister(false)
    setShowLogIn(true)
  }

  const openRegister = () => {
    setShowLogIn(false)
    setShowRegister(true)
  }

  const closeModals = () => {
    setShowLogIn(false)
    setShowRegister(false)
  }

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      closeModals()
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="logo">deb8</h1>
        <nav className="auth-buttons" aria-label="Autenticación">
          <button className="log-in-btn" onClick={openLogIn} aria-label="Iniciar sesión">
            Log in
          </button>
          <button className="register-btn" onClick={openRegister} aria-label="Registrarse">
            Register
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <h2 className="welcome-title">Bienvenido a deb8</h2>
      </main>

      {/* Modals */}
      <LogInModal isOpen={showLogIn} onClose={closeModals} onSwitchToRegister={openRegister} />

      <RegisterModal isOpen={showRegister} onClose={closeModals} onSwitchToLogIn={openLogIn} />
    </div>
  )
}

export default LandingPage