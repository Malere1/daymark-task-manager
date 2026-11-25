import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('daymark_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function saveSession(token: string) {
  localStorage.setItem('daymark_token', token);
}
export function clearSession() {
  localStorage.removeItem('daymark_token');
}
export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}