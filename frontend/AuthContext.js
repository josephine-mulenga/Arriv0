import React, { createContext, useState, useContext } from 'react';
import { login as apiLogin, signup as apiSignup, setToken } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiLogin(email, password);
      setAuthToken(data.access_token);
      setUser({ id: data.user_id, email });
      setToken(data.access_token, data.user_id);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, school, visaType, yearLevel, programEndDate) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiSignup(email, password, name, school, visaType, yearLevel, programEndDate);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setToken(null, null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);