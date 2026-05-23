import api from './axiosInstance';

export const listThreatTypes = (params) =>
  api.get('/threat-types', { params }).then((r) => r.data);

export const createThreatType = (body) =>
  api.post('/threat-types', body).then((r) => r.data);

export const updateThreatType = (id, body) =>
  api.put(`/threat-types/${id}`, body).then((r) => r.data);

export const deactivateThreatType = (id) =>
  api.patch(`/threat-types/${id}/deactivate`).then((r) => r.data);