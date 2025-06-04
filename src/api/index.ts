import axios from "axios";

export const api = axios.create({
  baseURL: "https://7ger1x52bl.execute-api.sa-east-1.amazonaws.com/prod"
})


api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  if (auth.access_token) {
    config.headers.Authorization = `Bearer ${auth.access_token}`;
  }
  return config;
});
