import api from './axiosInstance';

export const listAssets = (params) => api.get('/assets', { params }).then((r) => r.data);
