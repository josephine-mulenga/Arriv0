let logoutHandler = null;

export const setLogoutHandler = (fn) => {
  logoutHandler = fn;
};

export const triggerLogout = () => {
  if (logoutHandler) logoutHandler();
};