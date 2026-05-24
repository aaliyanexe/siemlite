import api from './axiosInstance';

export const listIncidents = (params) =>
  api.get('/incidents', { params }).then((r) => r.data);

export const getIncident = (id) => api.get(`/incidents/${id}`).then((r) => r.data);

export const createIncident = (body) => api.post('/incidents', body).then((r) => r.data);

export const getTimeline = (id) => api.get(`/incidents/${id}/timeline`).then((r) => r.data);

export const getResponses = (id) => api.get(`/incidents/${id}/responses`).then((r) => r.data);

// Status actions
export const updateIncident = (id, body) => api.put(`/incidents/${id}`, body).then(r => r.data);
export const assignIncident = (id, body) => api.patch(`/incidents/${id}/assign`, body).then(r => r.data);
export const changeStatus = (id, body) => api.patch(`/incidents/${id}/status`, body).then(r => r.data);
export const resolveIncident = (id, body) => api.patch(`/incidents/${id}/resolve`, body).then(r => r.data);
export const reopenIncident = (id) => api.patch(`/incidents/${id}/reopen`).then(r => r.data);
export const deleteIncident = (id) => api.delete(`/incidents/${id}`).then(r => r.data);

// Response actions
export const createResponse = (id, body) => api.post(`/incidents/${id}/responses`, body).then(r => r.data);
export const updateResponse = (id, rid, body) => api.put(`/incidents/${id}/responses/${rid}`, body).then(r => r.data);
export const deleteResponse = (id, rid) => api.delete(`/incidents/${id}/responses/${rid}`).then(r => r.data);

// Analysts dropdown
export const listAnalysts = () => api.get('/users', { params: { role: 'Analyst', status: 'active', limit: 100 } }).then(r => r.data);