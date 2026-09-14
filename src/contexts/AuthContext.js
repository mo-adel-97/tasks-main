import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const readCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => readCachedUser());

  useEffect(() => {
    const syncUser = () => setCurrentUser(readCachedUser());
    window.addEventListener('storage', syncUser);
    window.addEventListener('sstli-auth-refreshed', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('sstli-auth-refreshed', syncUser);
    };
  }, []);

  const login = (userData, token) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_branch');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
