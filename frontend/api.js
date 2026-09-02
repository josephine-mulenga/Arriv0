import { triggerLogout } from './authEvents';
import { supabase } from './supabase';

const BASE_URL = 'https://arriv0-production.up.railway.app';

// FastAPI's own validation errors return `detail` as an array of
// {msg, loc, ...} objects rather than a string — passing that straight into
// `new Error()` silently stringifies to "[object Object]". This normalizes
// every shape `detail` can take into something readable.
const extractErrorMessage = (data, fallback) => {
  const detail = data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => (typeof item === 'string' ? item : item?.msg)).filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') return detail.msg;
  return fallback;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    triggerLogout();
    throw new Error('Session expired. Please log in again.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(extractErrorMessage(data, 'Request failed'));
  return data;
};

export const signup = async (email, password, name, school, visaType, programStartDate, programEndDate, major, hasSsn, hasBankAccount, cptMonthsUsed, referralCode) => {
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
      cpt_months_used: cptMonthsUsed,
      referral_code: referralCode || undefined
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(extractErrorMessage(data, 'Signup failed'));
  return data;
};

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(extractErrorMessage(data, 'Login failed'));
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

export const resendConfirmation = async (email) => {
  const response = await fetch(`${BASE_URL}/resend-confirmation`, {
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

export const getTimeline = async (token, year) => {
  const url = year ? `${BASE_URL}/timeline?year=${year}` : `${BASE_URL}/timeline`;
  const response = await fetch(url, {
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

export const getNews = async (token, { tag, page } = {}) => {
  const params = new URLSearchParams();
  if (tag && tag !== 'All') params.set('tag', tag);
  if (page) params.set('page', String(page));
  const query = params.toString();
  const response = await fetch(`${BASE_URL}/news${query ? `?${query}` : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const searchNews = async (query, token) => {
  const response = await fetch(`${BASE_URL}/news/search?q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getSingleNews = async (newsId, token) => {
  const response = await fetch(`${BASE_URL}/news/${newsId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getMilestones = async (token) => {
  const response = await fetch(`${BASE_URL}/milestones`, {
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

export const addBookmark = async (article, token) => {
  const response = await fetch(`${BASE_URL}/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      news_title: article.title,
      news_body: article.body,
      news_link: article.link,
      news_tag: article.tag,
      news_image_url: article.image_url
    })
  });
  return handleResponse(response);
};

export const getBookmarks = async (token) => {
  const response = await fetch(`${BASE_URL}/bookmarks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const deleteBookmark = async (bookmarkId, token) => {
  const response = await fetch(`${BASE_URL}/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getChatHistory = async (token) => {
  const response = await fetch(`${BASE_URL}/chat/history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const clearChatHistory = async (token) => {
  const response = await fetch(`${BASE_URL}/chat/history`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getOnboardingScore = async (token) => {
  const response = await fetch(`${BASE_URL}/onboarding-score`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const forceFetchNews = async (token) => {
  const response = await fetch(`${BASE_URL}/fetch-news`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const getDocuments = async (token) => {
  const response = await fetch(`${BASE_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const updateDocument = async (documentId, collected, notes, token) => {
  const response = await fetch(`${BASE_URL}/documents/${documentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ collected, notes })
  });
  return handleResponse(response);
};

export const getDsoDirectory = async (token) => {
  const response = await fetch(`${BASE_URL}/dso-directory`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const searchDso = async (school, token) => {
  const response = await fetch(`${BASE_URL}/dso-search?school=${encodeURIComponent(school)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const generateReferralCode = async (token) => {
  const response = await fetch(`${BASE_URL}/referral/generate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const sendReferralInvite = async (referredEmail, token) => {
  const response = await fetch(`${BASE_URL}/referral/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ referred_email: referredEmail })
  });
  return handleResponse(response);
};

export const getReferralStats = async (token) => {
  const response = await fetch(`${BASE_URL}/referral/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const verifyReferralCode = async (code, token) => {
  const response = await fetch(`${BASE_URL}/referral/verify?code=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(response);
};

export const uploadAvatar = async (userId, imageUri) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const fileExt = imageUri.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;
  const { error } = await supabase.storage
    .from('Avatar')
    .upload(filePath, blob, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage
    .from('Avatar')
    .getPublicUrl(filePath);
  return data.publicUrl;
};