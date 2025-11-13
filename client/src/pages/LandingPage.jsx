import { useState } from "react"
import "./LandingPage.css"
import LogInModal from "../components/LogInModal"
import RegisterModal from "../components/RegisterModal"


function LandingPage() {
  const [showLogIn, setShowLogIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const faqs = [
    {
      q: "¿Qué es deb8?",
      a: "Es una plataforma para crear, descubrir y participar en debates en tiempo real, en texto o voz.",
    },
    {
      q: "¿Cómo me registro?",
      a: "Haz clic en el botón Register de arriba, completa tus datos y confirma. También puedes alternar desde el modal de Log in.",
    },
    {
      q: "¿Necesito cuenta para ver debates?",
      a: "Puedes explorar la landing, pero para acceder al Home y unirte/crear debates necesitas una cuenta.",
    },
    {
      q: "¿Cómo creo un debate?",
      a: "Una vez dentro del Home, usa el botón Crear debate. Podrás elegir duración, participantes, modo y formato.",
    },
    {
      q: "¿Hay debates por voz?",
      a: "Sí. Al crear o abrir un debate con formato Voz entrarás a una sala de voz dedicada.",
    },
  ]
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i)

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
      <section className="faq-section" aria-label="Preguntas frecuentes">
        <div className="faq-container">
          <h2 className="faq-title">Preguntas frecuentes</h2>
          <div className="faq-list">
            {faqs.map((item, i) => (
              <div className="faq-item" key={i}>
                <button
                  className="faq-question"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => toggleFaq(i)}
                >
                  <span>{item.q}</span>
                  <svg
                    className={`faq-icon ${openFaq === i ? "open" : ""}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openFaq === i && (
                  <div id={`faq-panel-${i}`} className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      <LogInModal isOpen={showLogIn} onClose={closeModals} onSwitchToRegister={openRegister} />

      <RegisterModal isOpen={showRegister} onClose={closeModals} onSwitchToLogIn={openLogIn} />
    </div>
  )
}

export default LandingPage