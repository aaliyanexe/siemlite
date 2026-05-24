import api from './axiosInstance';

export const login  = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const logout = () =>
  api.post('/auth/logout').then(r => r.data);

// ── NEW ──────────────────────────────────────────────────────────────────────
export const changeMyPassword = (current_password, new_password) =>
  api.patch('/users/me/password', { current_password, new_password }).then(r => r.data);