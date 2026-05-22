import api from './axiosInstance';

export const listThreatTypes = (params) =>
  api.get('/threat-types', { params }).then((r) => r.data);
