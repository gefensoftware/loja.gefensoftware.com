import axios from "axios";
import type { Metadata, Viewport } from 'next'

export const api = axios.create({
  baseURL: "https://7ger1x52bl.execute-api.sa-east-1.amazonaws.com/prod"
  // baseURL: "http://localhost:3003"
})

// API para uso no servidor (sem interceptor)
export const serverApi = axios.create({
  baseURL: "https://7ger1x52bl.execute-api.sa-east-1.amazonaws.com/prod"
  // baseURL: "http://localhost:3003"
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (auth.access_token) {
      config.headers.Authorization = `Bearer ${auth.access_token}`;
    }
  }
  return config;
});

export const metadata: Metadata = {
  // ... outras configurações ...
  // viewport removido daqui
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
