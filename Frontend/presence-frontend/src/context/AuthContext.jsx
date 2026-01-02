import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Par défaut false; sera mis à true après validation/login

  useEffect(() => {
    // Vérifier l'authentification au chargement
    const checkAuth = async () => {
      setLoading(true);
      const token = authService.getToken();
      const storedUser = authService.getUser();
      
      if (token && storedUser) {
        try {
          // Valider le token avec le backend
          const isValid = await authService.validateToken(token);
          
          if (isValid) {
            setIsAuthenticated(true);
            setUser(storedUser);
            setIsAdmin(true); // Dans votre cas, tous les utilisateurs connectés sont admin
          } else {
            // Token invalide, déconnecter
            authService.logout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Erreur de validation du token:', error);
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const result = await authService.login(email, password, rememberMe);
      
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        setIsAdmin(true); // Tous les utilisateurs connectés sont admin
        return { success: true };
      } else {
        return { 
          success: false, 
          message: result.message || 'Identifiants incorrects' 
        };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        message: 'Erreur serveur. Veuillez réessayer.' 
      };
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    isAdmin,
    // Rôle utilisé par les ProtectedRoute
    role: isAdmin ? 'ADMIN' : null,
    login,
    logout,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// HOC pour protéger les routes
export const withAuth = (Component) => {
  return function ProtectedComponent(props) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated || !isAdmin) {
      window.location.href = '/admin/login';
      return null;
    }
    
    return <Component {...props} />;
  };
};