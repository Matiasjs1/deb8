import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import FilterBar from '../components/FilterBarI18n.jsx';
import DebateCard from '../components/DebateCard.jsx';
import CreateDebateModal from '../components/CreateDebateModal.jsx';
import Footer from '../components/Footer.jsx';
import { userRequest, isAuthenticated } from '../api/auth.js';
import { getDebates } from '../api/debates.js';
import './Home.css'
import { connectSocket, getSocket } from '../api/socket.js'
import { useI18n } from '../i18n/LocaleProvider.jsx'


function Home() {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filteredDebates, setFilteredDebates] = useState([]);
  const [debates, setDebates] = useState([]);
  const [user, setUser] = useState(null);  
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingDebates, setLoadingDebates] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userRequest();
        setUser(res.data);
      } catch (error) {
        console.error('Error cargando perfil:', error);
        // Si hay un error de autenticación, redirigir al inicio
        if (error.response?.status === 401) {
          navigate('/');
        }
      } finally {
        setLoadingUser(false);
      }
    };

    const fetchDebates = async () => {
      try {
        const response = await getDebates();
        setDebates(response.data.debates);
      } catch (error) {
        console.error('Error cargando debates:', error);
      } finally {
        setLoadingDebates(false);
      }
    };

    fetchUser();
    fetchDebates();

    // Conectar Socket y suscribirse a eventos de tiempo real para el Home
    connectSocket();
    const s = getSocket();
    if (s) {
      const onCreated = (debate) => {
        setDebates((prev) => {
          if (prev.find(d => d._id === debate._id)) return prev; // evitar duplicados
          return [debate, ...prev];
        });
      };
      const onUpdated = (payload) => {
        setDebates((prev) => prev.map(d => d._id === payload._id ? { ...d, ...payload } : d));
      };
      const onDeleted = ({ _id }) => {
        setDebates((prev) => prev.filter(d => d._id !== _id));
      };

      s.on('debate_created', onCreated);
      s.on('debate_updated', onUpdated);
      s.on('debate_deleted', onDeleted);

      return () => {
        s.off('debate_created', onCreated);
        s.off('debate_updated', onUpdated);
        s.off('debate_deleted', onDeleted);
      };
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  // Evitar duplicados: no agregamos localmente al crear; nos apoyamos en el evento socket 'debate_created'
  const handleDebateCreated = (debate) => {
    const route = debate.format === 'Voz' ? `/voice-debates/${debate._id}` : `/debates/${debate._id}`;
    navigate(route);
  };



  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    
    let filtered = debates.filter(debate => {
      // Filtro por tiempo
      if (filters.Tiempo.min && debate.duration < parseInt(filters.Tiempo.min)) {
        return false;
      }
      if (filters.Tiempo.max && debate.duration > parseInt(filters.Tiempo.max)) {
        return false;
      }

      // Filtro por personas
      if (filters.Personas.min && debate.currentParticipants < parseInt(filters.Personas.min)) {
        return false;
      }
      if (filters.Personas.max && debate.currentParticipants > parseInt(filters.Personas.max)) {
        return false;
      }

      // Filtro por modo
      if (filters.Modo.length > 0 && !filters.Modo.includes(debate.mode)) {
        return false;
      }

      // Filtro por formato
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

  // Si está cargando, mostrar loading
  if (loadingUser || loadingDebates) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {sidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      
      <Header onToggleSidebar={toggleSidebar} user={user} loadingUser={loadingUser} />

      <main className="main-content">
        <div className="main-header">
          <FilterBar onApplyFilters={handleApplyFilters} />
          <button 
            className="create-debate-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('home.create_debate')}
          </button>
        </div>

        <div className="results-info">
          <span>{debatesToShow.length} {t('home.debates_found')}</span>
        </div>

        <div className="debates-grid">
          {debatesToShow.map(debate => (
            <DebateCard key={debate._id} debate={debate} currentUser={user} />
          ))}
        </div>
      </main>

      <CreateDebateModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDebateCreated={handleDebateCreated}
      />

      <Footer />

      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />
    </div>
  );
}

export default Home;