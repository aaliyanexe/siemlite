import api from './axiosInstance';

export const login  = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const logout = () =>
  api.post('/auth/logout').then(r => r.data);

// ── NEW ──────────────────────────────────────────────────────────────────────
// src/api/auth.api.js
export const changeMyPassword = (currentPassword, newPassword) =>
  // POST to match the auth.routes.js requirement
  api.post('/auth/change-password', { currentPassword, newPassword }).then(r => r.data);