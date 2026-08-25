import { triggerLogout } from './authEvents';

const BASE_URL = 'https://arriv0-production.up.railway.app';

const handleResponse = async (response) => {
  if (response.status === 401) {
    triggerLogout();
    throw new Error('Session expired. Please log in again.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Request failed');
  return data;
};

export const signup = async (email, password, name, school, visaType, programStartDate, programEndDate, major, hasSsn, hasBankAccount, cptMonthsUsed) => {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      school,
      visa_type: visaType,
      program_start_date: programStartDate,
      program_end_date: programEndDate,
      major: major,
      has_ssn: hasSsn,
      has_bank_account: hasBankAccount,
      cpt_months_used: cptMonthsUsed
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
  return handleResponse(response);
};

export const getTimeline = async (yearLevel, token) => {
  const response = await fetch(`${BASE_URL}/timeline/${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getStatus = async (token) => {
  const response = await fetch(`${BASE_URL}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getNews = async (token) => {
  const response = await fetch(`${BASE_URL}/news`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getMilestones = async (yearLevel, token) => {
  const response = await fetch(`${BASE_URL}/milestones/${yearLevel}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getAIStatus = async (token) => {
  const response = await fetch(`${BASE_URL}/ai-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
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
  return handleResponse(response);
};

export const savePushToken = async (userId, pushToken, token) => {
  const response = await fetch(`${BASE_URL}/save-token?user_id=${userId}&push_token=${pushToken}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
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
  return handleResponse(response);
};

export const updateProfile = async (userId, updates, token) => {
  const response = await fetch(`${BASE_URL}/user/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  return handleResponse(response);
};

export const getTimezones = async (token) => {
  const response = await fetch(`${BASE_URL}/timezones`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};
