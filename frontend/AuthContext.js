import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, signup as apiSignup, setToken } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedEmail = await AsyncStorage.getItem('userEmail');

        if (storedToken && storedUserId) {
          setAuthToken(storedToken);
          setUser({ id: storedUserId, email: storedEmail });
          setToken(storedToken, storedUserId);
        }
      } catch (err) {
        console.log('Failed to load stored auth', err);
      } finally {
        setInitializing(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiLogin(email, password);
      setAuthToken(data.access_token);
      setUser({ id: data.user_id, email });
      setToken(data.access_token, data.user_id);

      await AsyncStorage.setItem('authToken', data.access_token);
      await AsyncStorage.setItem('userId', String(data.user_id));
      await AsyncStorage.setItem('userEmail', email);

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

  const logout = async () => {
    setUser(null);
    setAuthToken(null);
    setToken(null, null);
    await AsyncStorage.multiRemove(['authToken', 'userId', 'userEmail']);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, initializing, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);