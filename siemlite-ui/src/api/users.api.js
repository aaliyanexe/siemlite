import api from './axiosInstance';

export const listUsers       = (params)       => api.get('/users', { params }).then(r => r.data);
export const getUser         = (id)           => api.get(`/users/${id}`).then(r => r.data);
export const createUser      = (body)         => api.post('/users', body).then(r => r.data);
export const updateUser      = (id, body)     => api.put(`/users/${id}`, body).then(r => r.data);
export const deactivateUser  = (id)           => api.patch(`/users/${id}/deactivate`).then(r => r.data);
export const resetPassword   = (id, password) => api.patch(`/users/${id}/reset-password`, { password }).then(r => r.data);
