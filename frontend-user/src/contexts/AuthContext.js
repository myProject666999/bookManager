import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        fetchCurrentUser();
      } catch (e) {
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await userApi.getCurrentUser();
      if (response.data.code === 200) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } else {
        logout();
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await userApi.login({ username, password });
    if (response.data.code === 200) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } else {
      return { success: false, message: response.data.message };
    }
  };

  const register = async (userData) => {
    const response = await userApi.register(userData);
    if (response.data.code === 200) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } else {
      return { success: false, message: response.data.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    refreshUser: fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
