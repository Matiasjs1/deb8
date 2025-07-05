import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../api/auth.js';

function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      
      if (!authenticated) {
        navigate('/');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Verificando autenticación...</div>
      </div>
    );
  }

  if (!isAuth) {
    return null; // No renderizar nada si no está autenticado
  }

  return children;
}

export default ProtectedRoute; 