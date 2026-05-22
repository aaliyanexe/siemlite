import api from './axiosInstance';

export const getAdminDashboard = () =>
  api.get('/analytics/dashboard/admin').then((r) => r.data);

export const getAnalystDashboard = () =>
  api.get('/analytics/dashboard/analyst').then((r) => r.data);

export const getThreatFrequency = (params) =>
  api.get('/analytics/threat-frequency', { params }).then((r) => r.data);
