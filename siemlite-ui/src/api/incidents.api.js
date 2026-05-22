import api from './axiosInstance';

export const listIncidents = (params) =>
  api.get('/incidents', { params }).then((r) => r.data);

export const getIncident = (id) => api.get(`/incidents/${id}`).then((r) => r.data);

export const createIncident = (body) => api.post('/incidents', body).then((r) => r.data);

export const getTimeline = (id) => api.get(`/incidents/${id}/timeline`).then((r) => r.data);

export const getResponses = (id) => api.get(`/incidents/${id}/responses`).then((r) => r.data);
