import api from './axiosInstance';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const logout = () => api.post('/auth/logout').then((r) => r.data);
