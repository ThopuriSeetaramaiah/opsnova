import api from './client';

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  register: (data: { email: string; password: string; full_name: string }) => api.post('/auth/register', data),
};

export const awsApi = {
  getAccounts: () => api.get('/aws/accounts'),
  addAccount: (data: object) => api.post('/aws/accounts', data),
  syncAccount: (id: number) => api.post(`/aws/accounts/${id}/sync`),
  deleteAccount: (id: number) => api.delete(`/aws/accounts/${id}`),
  getInventory: (id: number) => api.get(`/aws/accounts/${id}/inventory`),
};

export const costsApi = {
  getSummary: () => api.get('/costs/summary'),
  getByService: () => api.get('/costs/by-service'),
  getTrend: (days = 30) => api.get(`/costs/trend?days=${days}`),
  getAnomalies: () => api.get('/costs/anomalies'),
};

export const k8sApi = {
  getClusters: () => api.get('/kubernetes/clusters'),
  getNodes: (id: string) => api.get(`/kubernetes/clusters/${id}/nodes`),
  getPods: (id: string) => api.get(`/kubernetes/clusters/${id}/pods`),
  getMetrics: (id: string) => api.get(`/kubernetes/clusters/${id}/metrics`),
};

export const recommendationsApi = {
  getAll: (category?: string) => api.get('/recommendations', { params: { category } }),
  generate: () => api.post('/recommendations/generate'),
  updateStatus: (id: number, status: string) => api.patch(`/recommendations/${id}/status`, { status }),
};

export const alertsApi = {
  getAll: (params?: object) => api.get('/alerts', { params }),
  getSummary: () => api.get('/alerts/summary'),
  resolve: (id: number) => api.patch(`/alerts/${id}/resolve`),
};
