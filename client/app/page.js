"use client"

import { useState } from "react"
import { Search, Menu, Filter, Clock, Users, Instagram, Facebook, Twitter } from "lucide-react"

export default function Deb8Platform() {
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
    <div className="min-h-screen bg-slate-900 text-white relative">
      {/* Overlay when sidebar is open */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />}

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-cyan-400">deb8</h1>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar debates..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-cyan-400" />
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex space-x-2">
          {["Todos", "Mis", "Chat Gpt", "Personales", "Sociales"].map((filter) => (
            <button
              key={filter}
              className="px-3 py-1 text-sm border border-slate-600 rounded hover:border-cyan-400 transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debates.map((debate) => (
            <div
              key={debate.id}
              className={`bg-slate-800 rounded-lg p-4 border-2 transition-all hover:border-cyan-400 ${
                debate.highlighted ? "border-purple-500" : "border-slate-700"
              }`}
            >
              <h3 className="text-lg font-semibold mb-3">{debate.title}</h3>

              <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{debate.participants}/4</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{debate.timeLeft}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs bg-slate-700 px-2 py-1 rounded">{debate.category}</span>
                <button className="text-cyan-400 text-sm hover:underline">Por turnos</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-slate-800 border-l border-slate-700 transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold">Menú</h2>
            <button onClick={toggleSidebar} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              ✕
            </button>
          </div>

          <nav className="space-y-4">
            <a href="#" className="block py-3 px-4 hover:bg-slate-700 rounded-lg transition-colors">
              Cuentas
            </a>
            <a href="#" className="block py-3 px-4 hover:bg-slate-700 rounded-lg transition-colors">
              Monedas
            </a>
            <a href="#" className="block py-3 px-4 hover:bg-slate-700 rounded-lg transition-colors text-red-400">
              Cerrar Sesión
            </a>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 p-6 mt-12">
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-400">
            <p>Contacto</p>
            <p>Soporte</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">deb8 • 2025</p>
          </div>

          <div className="flex space-x-4">
            <p className="text-sm text-slate-400 mb-2">Redes</p>
            <div className="flex space-x-2">
              <Instagram className="w-5 h-5 text-slate-400 hover:text-cyan-400 cursor-pointer" />
              <Facebook className="w-5 h-5 text-slate-400 hover:text-cyan-400 cursor-pointer" />
              <Twitter className="w-5 h-5 text-slate-400 hover:text-cyan-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Select Button */}
      <button className="fixed bottom-6 left-6 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        Seleccionar
      </button>
    </div>
  )
}
