import axios from 'axios';

// Dùng relative path để API requests tự động dùng current domain
export const API_URL = process.env.REACT_APP_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});
