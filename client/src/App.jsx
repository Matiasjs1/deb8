import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DebateCard from './components/DebateCard';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filteredDebates, setFilteredDebates] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const debates = [
    {
      id: 1,
      title: "¿Cuál es la mejor temporada?",
      participants: "2/4",
      participantCount: 2,
      maxParticipants: 4,
      author: "Por turnos",
      duration: "40 min",
      durationMinutes: 40,
      tags: ["Comida"],
      format: "Voz",
      mode: "Por turnos"
    },
    {
      id: 2,
      title: "Comunismo vs. Capitalismo",
      participants: "3/4",
      participantCount: 3,
      maxParticipants: 4,
      author: "Libre",
      duration: "30 min",
      durationMinutes: 30,
      tags: ["Política", "Economía"],
      format: "Voz",
      mode: "Libre"
    },
    {
      id: 3,
      title: "Eutanasia, ¿Sí o no?",
      participants: "1/3",
      participantCount: 1,
      maxParticipants: 3,
      author: "Por turnos",
      duration: "35 min",
      durationMinutes: 35,
      tags: ["Ciencia", "Moral"],
      format: "Voz",
      mode: "Por turnos"
    },
    {
      id: 4,
      title: "Inteligencia Artificial: ¿Amenaza o Oportunidad?",
      participants: "2/4",
      participantCount: 2,
      maxParticipants: 4,
      author: "Moderado",
      duration: "60 min",
      durationMinutes: 60,
      tags: ["Tecnología", "Filosofía"],
      format: "Texto",
      mode: "Moderado"
    },
    {
      id: 5,
      title: "El futuro del trabajo remoto",
      participants: "3/4",
      participantCount: 3,
      maxParticipants: 4,
      author: "Libre",
      duration: "25 min",
      durationMinutes: 25,
      tags: ["Sociedad", "Tecnología"],
      format: "Texto",
      mode: "Libre"
    }
  ];

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    
    let filtered = debates.filter(debate => {
      // Filtro por tiempo
      if (filters.Tiempo.min && debate.durationMinutes < parseInt(filters.Tiempo.min)) {
        return false;
      }
      if (filters.Tiempo.max && debate.durationMinutes > parseInt(filters.Tiempo.max)) {
        return false;
      }

      // Filtro por personas
      if (filters.Personas.min && debate.participantCount < parseInt(filters.Personas.min)) {
        return false;
      }
      if (filters.Personas.max && debate.participantCount > parseInt(filters.Personas.max)) {
        return false;
      }

      // Filtro por modo
      if (filters.Modo.length > 0 && !filters.Modo.includes(debate.mode)) {
        return false;
      }

      // Filtro por dificultad
      if (filters.Formato.length > 0 && !filters.Formato.includes(debate.format)) {
        return false;
      }

      // Filtro por temática
      if (filters.Temática.length > 0) {
        const hasMatchingTag = debate.tags.some(tag => filters.Temática.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });

    setFilteredDebates(filtered);
  };

  const debatesToShow = Object.keys(appliedFilters).length === 0 || 
    Object.values(appliedFilters).every(filter => 
      Array.isArray(filter) ? filter.length === 0 : 
      typeof filter === 'object' ? Object.values(filter).every(v => v === '') : 
      !filter
    ) ? debates : filteredDebates;

  return (
    <div className="app">
      {sidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      
      <Header onToggleSidebar={toggleSidebar} />

      <main className="main-content">
        <FilterBar onApplyFilters={handleApplyFilters} />

        <div className="results-info">
          <span>{debatesToShow.length} debates encontrados</span>
        </div>

        <div className="debates-grid">
          {debatesToShow.map(debate => (
            <DebateCard key={debate.id} debate={debate} />
          ))}
        </div>
      </main>

      <Footer />

      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
    </div>
  );
}

export default App;