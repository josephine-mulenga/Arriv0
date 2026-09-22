import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { signup as apiSignup } from './api';
import { supabase } from './supabase';
import { setLogoutHandler } from './authEvents';
import { friendlyErrorMessage } from './utils/errorMessage';

const AuthContext = createContext(null);

// Supabase's own error text is a fine developer-facing message but not
// something to show a student trying to log in - this maps the handful of
// cases that actually reach a user to plain, friendly copy. Anything
// unrecognized falls back to a generic message rather than leaking
// Supabase's wording (which can include internal codes) to the screen.
function friendlyAuthError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Email or password is incorrect. Please try again.';
  }
  if (msg.includes('email not confirmed') || msg.includes('confirm')) {
    return 'Please confirm your email before logging in — check your inbox for the link we sent.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Could not connect. Please check your internet and try again.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const appState = useRef(AppState.currentState);

  // Auth now lives entirely in the Supabase client's own session (see
  // supabase.js: persistSession + autoRefreshToken), instead of a single
  // access_token stashed in AsyncStorage with no way to renew it - that gap
  // is what forced a re-login every time the short-lived access token
  // expired. getSession() restores whatever the client already persisted on
  // launch, and onAuthStateChange keeps this context's token/user in sync
  // with every silent refresh from then on, for as long as the underlying
  // refresh token stays valid (weeks, not the ~1hr access token lifetime).
  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted || !data.session) return;
        setAuthToken(data.session.access_token);
        setUser({ id: data.session.user.id, email: data.session.user.email });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setInitializing(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setAuthToken(session.access_token);
        setUser({ id: session.user.id, email: session.user.email });
      } else if (event === 'SIGNED_OUT') {
        setAuthToken(null);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // autoRefreshToken's timer only keeps ticking while something calls
  // startAutoRefresh - on native (unlike web, which has the page visibility
  // API) that doesn't happen automatically on its own when the app comes
  // back from the background, so a refresh that came due while backgrounded
  // would otherwise never fire until the next explicit auth call.
  useEffect(() => {
    supabase.auth.startAutoRefresh();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        supabase.auth.startAutoRefresh();
      } else if (nextState.match(/inactive|background/)) {
        supabase.auth.stopAutoRefresh();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      setAuthToken(data.session.access_token);
      setUser({ id: data.user.id, email: data.user.email });
      return data;
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email,
    password,
    name,
    school,
    visaType,
    programStartDate,
    programEndDate,
    major,
    hasSsn,
    hasBankAccount,
    cptMonthsUsed,
    referralCode,
    biggestConcern,
    hasJobOffer,
    plansAfterGraduation,
    workExperienceMonths,
    citizenshipCountry
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiSignup(
        email,
        password,
        name,
        school,
        visaType,
        programStartDate,
        programEndDate,
        major,
        hasSsn,
        hasBankAccount,
        cptMonthsUsed,
        referralCode,
        biggestConcern,
        hasJobOffer,
        plansAfterGraduation,
        workExperienceMonths,
        citizenshipCountry
      );
      return data;
    } catch (err) {
      const message = friendlyErrorMessage(err, 'Could not create your account. Please try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Used where we already hold a valid Supabase session but not the user's
  // password (email confirmation, magic links) - onAuthStateChange above
  // will normally have already picked this same session up by the time this
  // runs; this just makes the state update immediate rather than waiting on
  // that event.
  const loginWithToken = async (accessToken, userId, email) => {
    setAuthToken(accessToken);
    setUser({ id: userId, email: email || null });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthToken(null);
  };

  setLogoutHandler(logout);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, initializing, error, login, loginWithToken, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
