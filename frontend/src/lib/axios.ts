import axios from 'axios';

// 개발 환경과 프로덕션 환경에 따라 baseURL 설정
const baseURL = 'https://trpg-dao-nft.onrender.com'

console.log(`API baseURL: ${baseURL}, Environment: ${process.env.NODE_ENV}`);

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    // 디버깅을 위한 로그 추가
    console.log(`요청 URL: ${config.url}`);
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Auth 토큰이 요청에 포함되었습니다');
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
    // 응답 디버깅
    console.log(`응답 상태 코드: ${response.status}`);
    return response;
  },
  (error) => {
    // CORS 오류 감지
    if (error.message && error.message.includes('Network Error')) {
      console.error('CORS 오류가 발생했을 수 있습니다:', error);
      console.log('브라우저 콘솔에서 더 자세한 오류 정보를 확인하세요');
    }
    
    if (error.response) {
      console.error(`오류 응답 코드: ${error.response.status}`);
      console.error('오류 응답 데이터:', error.response.data);
      
      if (error.response.status === 401) {
        console.warn('인증 오류 - 로그인 필요');
      } else if (error.response.status === 403) {
        console.warn('권한 부족 - 접근 거부됨');
      } else if (error.response.status === 500) {
        console.error('서버 내부 오류 발생');
      }
    } else if (error.code === 'ERR_NETWORK') {
      console.error('네트워크 오류 - 서버가 응답하지 않거나 CORS 문제 발생');
    }

    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    console.log('토큰이 저장되었습니다');
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
  console.log('토큰이 제거되었습니다');
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export default api;
