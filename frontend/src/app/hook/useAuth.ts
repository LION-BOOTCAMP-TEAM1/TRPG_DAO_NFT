import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import api from '../../lib/axios';

// 인증 상태를 위한 인터페이스
interface AuthState {
  isAuthenticated: boolean; // 인증 여부
  isLoading: boolean; // 로딩 상태
  error: string | null; // 에러 메시지
  user: {
    walletAddress: string; // 지갑 주소
    userId?: string | number; // 사용자 ID (옵션)
  } | null;
}

export default function useAuth() {
  // 인증 상태 관리
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
  });

  /**
   * 페이지 로드 시 인증 상태 확인
   */
  useEffect(() => {
    // 페이지 로드 시 인증 상태 확인 (쿠키에 JWT 토큰이 있는지)
    checkAuthStatus();
  }, []);

  /**
   * 서버에 nonce 요청
   * @param address 지갑 주소
   * @returns nonce 문자열
   */
  const requestNonce = async (address: string): Promise<string> => {
    try {
      // 서버에 nonce 요청 (나중에 서명할 메시지)
      const response = await api.post('/api/auth/nonce', { address });
      return response.data.nonce;
    } catch (error) {
      console.error('nonce 요청 중 오류:', error);
      throw error;
    }
  };

  /**
   * 서명 검증
   * @param address 지갑 주소
   * @param signature 서명 값
   * @returns 검증 결과
   */
  const verifySignature = async (address: string, signature: string) => {
    try {
      // withCredentials는 쿠키를 주고받기 위해 필요합니다 (JWT 저장)
      const response = await api.post('/api/auth/verify', 
        { address, signature }, 
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('서명 검증 중 오류:', error);
      throw error;
    }
  };

  /**
   * 로그인 함수 - 메타마스크 지갑으로 서명하여 인증
   * @param signer ethers.js의 JsonRpcSigner 객체
   */
  const login = async (signer: ethers.JsonRpcSigner) => {
    if (!signer) {
      setAuthState(prev => ({
        ...prev,
        error: '연결된 지갑이 없습니다',
      }));
      return;
    }

    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // 1. 지갑 주소 가져오기
      const address = await signer.getAddress();
      
      // 2. 서버에서 nonce 가져오기
      const nonce = await requestNonce(address);
      
      // 3. 지갑으로 nonce에 서명하기
      const signature = await signer.signMessage(nonce);
      
      // 4. 서버에서 서명 검증하기
      const { success } = await verifySignature(address, signature);
      
      if (success) {
        // 로그인 성공
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          user: {
            walletAddress: address,
          },
        });
      }
    } catch (error: any) {
      console.error('인증 오류:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error?.response?.data?.error || error?.message || '인증에 실패했습니다',
      }));
    }
  };

  /**
   * 이미 인증된 사용자인지 확인 (JWT 토큰 검증)
   */
  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // 사용자 정보 엔드포인트가 있다면 사용 (현재 백엔드에 구현 필요)
      // 이 부분은 백엔드에 /api/auth/me 같은 엔드포인트가 필요합니다
      const response = await api.get('/api/auth/me', { withCredentials: true });
      
      if (response.data && response.data.user) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          user: response.data.user,
        });
      }
    } catch (error) {
      // 401 에러는 정상적인 로그아웃 상태이므로 에러로 처리하지 않음
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        user: null,
      });
    }
  };

  /**
   * 로그아웃 함수
   */
  const logout = async () => {
    try {
      // 로그아웃 엔드포인트가 있다면 호출 (쿠키 삭제)
      // 백엔드에 로그아웃 엔드포인트가 아직 없는 경우 직접 추가 필요
      // await api.post('/api/auth/logout', {}, { withCredentials: true });
      
      // 로컬 상태 초기화
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        user: null,
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
  };
}
