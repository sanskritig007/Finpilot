import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../core/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finpilot_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects username
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token } = response.data;
    localStorage.setItem('finpilot_token', access_token);
    setIsAuthenticated(true);
  };

  const signup = async (email, password) => {
    await api.post('/auth/signup', { email, password });
    // Auto login after signup
    await login(email, password);
  };

  const loginSandbox = async () => {
    const response = await api.post('/auth/sandbox');
    const { access_token } = response.data;
    localStorage.setItem('finpilot_token', access_token);
    localStorage.setItem('finpilot_is_sandbox', 'true');
    setIsAuthenticated(true);
  };

  const logout = async () => {
    const token = localStorage.getItem('finpilot_token');
    if (token) {
      try {
        await api.post(`/auth/logout?token=${token}`);
      } catch (err) {
        console.error("Logout error", err);
      }
    }
    localStorage.removeItem('finpilot_token');
    localStorage.removeItem('finpilot_is_sandbox');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, signup, logout, loginSandbox }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
