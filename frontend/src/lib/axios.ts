import axios from 'axios';

// 개발 환경과 프로덕션 환경에 따라 baseURL 설정
const baseURL =
  process.env.NODE_ENV === 'production'
    ? 'https://trpg-dao-nft.onrender.com' // 프로덕션 환경
    : 'http://localhost:5001'; // 개발 환경 (백엔드 서버 포트에 맞게 수정)

console.log(`API baseURL: ${baseURL}, Environment: ${process.env.NODE_ENV}`);

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Authentication error');
    }

    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - server may be unavailable');
    }

    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string) => {
  console.log('Token is being managed via cookies');
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
  console.log('Token cookies will be cleared by the backend');
};

export const getAuthToken = () => {
  return null;
};

export default api;
