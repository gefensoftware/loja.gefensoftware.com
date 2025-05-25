import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3003"
})

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  if (auth.access_token) {
    config.headers.Authorization = `Bearer ${auth.access_token}`;
  }
  return config;
});
