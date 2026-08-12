const BASE_URL = 'https://arriv0-production.up.railway.app';

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
  return data;
};

export const resetPassword = async (email) => {
  const response = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  return data;
};

export const getUserProfile = async (userId, token) => {
  const response = await fetch(`${BASE_URL}/user/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to fetch profile');
  return data;
};

export const getTimeline = async (yearLevel, token) => {
  const response = await fetch(`${BASE_URL}/timeline/${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to fetch timeline');
  return data;
};

export const getStatus = async (programEndDate, yearLevel, token) => {
  const response = await fetch(`${BASE_URL}/status?program_end_date=${programEndDate}&year_level=${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to fetch status');
  return data;
};

export const getNews = async (token) => {
  const response = await fetch(`${BASE_URL}/news`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to fetch news');
  return data;
};

export const getMilestones = async (yearLevel, token) => {
  const response = await fetch(`${BASE_URL}/milestones/${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to fetch milestones');
  return data;
};

export const getAIStatus = async (token) => {
  const response = await fetch(`${BASE_URL}/ai-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to get AI status');
  return data;
};

export const chat = async (question, token) => {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ question })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Chat failed');
  return data;
};

export const savePushToken = async (userId, pushToken, token) => {
  const response = await fetch(`${BASE_URL}/save-token?user_id=${userId}&push_token=${pushToken}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to save token');
  return data;
};

export const updateNotificationSettings = async (userId, notificationTime, timezone, token) => {
  const response = await fetch(`${BASE_URL}/notification-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: userId,
      notification_time: notificationTime,
      timezone: timezone
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to update settings');
  return data;
};