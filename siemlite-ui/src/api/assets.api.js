import api from './axiosInstance';

export const listAssets   = (params)    => api.get('/assets', { params }).then(r => r.data);
export const getAsset     = (id)        => api.get(`/assets/${id}`).then(r => r.data);
export const createAsset  = (body)      => api.post('/assets', body).then(r => r.data);
export const updateAsset  = (id, body)  => api.put(`/assets/${id}`, body).then(r => r.data);
export const deactivateAsset = (id)     => api.patch(`/assets/${id}/deactivate`).then(r => r.data);
export const getAssetIncidents = (id)   => api.get(`/assets/${id}/incidents`).then(r => r.data);