const BASE_URL = 'https://arriv0-production.up.railway.app';

let authToken = null;
let currentUser = null;

export const setToken = (token, user) => {
  authToken = token;
  currentUser = user;
};

export const getToken = () => authToken;
export const getCurrentUser = () => currentUser;

export const signup = async (email, password, name, school, visaType, yearLevel, programEndDate) => {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      school,
      visa_type: visaType,
      year_level: yearLevel,
      program_end_date: programEndDate
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Signup failed');
  return data;
};

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Login failed');
  setToken(data.access_token, data.user_id);
  return data;
};

export const getUserProfile = async (userId) => {
  const response = await fetch(`${BASE_URL}/user/${userId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get profile');
  return data;
};

export const getTimeline = async (yearLevel) => {
  const response = await fetch(`${BASE_URL}/timeline/${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get timeline');
  return data;
};

export const getStatus = async (programEndDate, yearLevel) => {
  const response = await fetch(
    `${BASE_URL}/status?program_end_date=${programEndDate}&year_level=${yearLevel}`,
    { headers: { 'Authorization': `Bearer ${authToken}` } }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get status');
  return data;
};

export const getNews = async () => {
  const response = await fetch(`${BASE_URL}/news`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get news');
  return data;
};

export const getMilestones = async (yearLevel) => {
  const response = await fetch(`${BASE_URL}/milestones/${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get milestones');
  return data;
};

export const getAIStatus = async (name, school, yearLevel, programEndDate) => {
  const response = await fetch(
    `${BASE_URL}/ai-status?name=${encodeURIComponent(name)}&school=${encodeURIComponent(school)}&year_level=${yearLevel}&program_end_date=${programEndDate}`,
    { headers: { 'Authorization': `Bearer ${authToken}` } }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get AI status');
  return data;
};