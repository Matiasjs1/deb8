"use client"

import { useState } from "react"
import { Search, Menu, Filter, Clock, Users, Instagram, Facebook, Twitter } from "lucide-react"

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const debates = [
    {
      id: 1,
      title: "¿Cuál es la mejor empanada?",
      participants: 4,
      timeLeft: "40 min",
      category: "comida",
      highlighted: true,
    },
    {
      id: 2,
      title: "Demócratas vs. Republicanos",
      participants: 4,
      timeLeft: "30 min",
      category: "política",
    },
    {
      id: 3,
      title: "Eutanasia, ¿Sí o no?",
      participants: 8,
      timeLeft: "35 min",
      category: "ética",
    },
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="app">
      {/* Overlay when sidebar is open */}
      {sidebarOpen && <div className="overlay" onClick={toggleSidebar} />}

      {/* Header */}
      <header className="header">
        <div>
          <h1 className="logo">deb8</h1>
        </div>

        <div className="search-container">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input type="text" placeholder="Buscar debates..." className="search-input" />
          </div>
        </div>

        <button onClick={toggleSidebar} className="menu-button">
          <Menu size={24} />
        </button>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <Filter className="filter-icon" />
        <div className="filter-buttons">
          {["Todos", "Mis", "Chat Gpt", "Personales", "Sociales"].map((filter) => (
            <button key={filter} className="filter-button">
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="debates-grid">
          {debates.map((debate) => (
            <div key={debate.id} className={`debate-card ${debate.highlighted ? "highlighted" : ""}`}>
              <h3 className="debate-title">{debate.title}</h3>

              <div className="debate-stats">
                <div className="stat-item">
                  <Users className="stat-icon" />
                  <span>{debate.participants}/4</span>
                </div>
                <div className="stat-item">
                  <Clock className="stat-icon" />
                  <span>{debate.timeLeft}</span>
                </div>
              </div>

              <div className="debate-footer">
                <span className="category-tag">{debate.category}</span>
                <a href="#" className="debate-link">
                  Por turnos
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Menú</h2>
            <button onClick={toggleSidebar} className="close-button">
              ✕
            </button>
          </div>

          <nav className="sidebar-nav">
            <a href="#" className="nav-link">
              Cuentas
            </a>
            <a href="#" className="nav-link">
              Monedas
            </a>
            <a href="#" className="nav-link danger">
              Cerrar Sesión
            </a>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <p>Contacto</p>
            <p>Soporte</p>
          </div>

          <div className="footer-center">
            <p className="footer-section">deb8 • 2025</p>
          </div>

          <div className="footer-right">
            <p className="footer-section">Redes</p>
            <div className="social-links">
              <Instagram className="social-icon" />
              <Facebook className="social-icon" />
              <Twitter className="social-icon" />
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Select Button */}
      <button className="floating-button">Seleccionar</button>
    </div>
  )
}

export default App
