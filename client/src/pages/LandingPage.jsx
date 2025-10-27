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
        <div className="logo">deb8</div>
        <div className="auth-buttons">
          <button className="log-in-btn" onClick={openLogIn}>
            Log in
          </button>
          <button className="register-btn" onClick={openRegister}>
            Register
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <h1 className="welcome-title">Bienvenido a deb8</h1>
      </main>

      {/* Modals */}
      <LogInModal isOpen={showLogIn} onClose={closeModals} onSwitchToRegister={openRegister} />

      <RegisterModal isOpen={showRegister} onClose={closeModals} onSwitchToLogIn={openLogIn} />
    </div>
  )
}

export default LandingPage