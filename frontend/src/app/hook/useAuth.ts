import { useState, useEffect, FormEvent } from 'react';
import { ethers } from 'ethers';
import api, { setAuthToken, removeAuthToken } from '../../lib/axios';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  walletExist: boolean;
  user: {
    walletAddress: string;
    userId?: string | number;
  } | null;
  signer: ethers.JsonRpcSigner | null;
}

export default function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    walletExist: false,
    user: null,
    signer: null,
  });

  useEffect(() => {
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
      const response = await api.post('/api/auth/verify', {
        address,
        signature,
      });

      return response.data;
    } catch (error) {
      console.error('서명 검증 중 오류:', error);
      throw error;
    }
  };

  const connectWallet = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAuthState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      if (!window.ethereum) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            '메타마스크가 설치되어 있지 않습니다. 메타마스크를 설치하고 다시 시도해주세요.',
        }));
        return;
      }

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await provider.getSigner();
        const address = await newSigner.getAddress();

        try {
          const nonce = await requestNonce(address);

          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            walletExist: true,
            signer: newSigner,
            user: {
              ...prev.user,
              walletAddress: address,
            },
          }));

          return newSigner;
        } catch (error: any) {
          if (error?.response?.status === 404) {
            setAuthState((prev) => ({
              ...prev,
              isLoading: false,
              walletExist: false,
              signer: newSigner,
              user: {
                ...prev.user,
                walletAddress: address,
              },
            }));
            return newSigner;
          }

          throw error;
        }
      } catch (error: any) {
        if (error.code === 4001) {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: '메타마스크 연결이 거부되었습니다. 연결을 허용해주세요.',
          }));
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('지갑 연결 오류:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || '지갑 연결 중 오류가 발생했습니다',
      }));
    }
  };

  const registerWalletAddress = async () => {
    if (!authState.signer) return false;

    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const address = await authState.signer.getAddress();

      const response = await api.post('/api/users/', { wallet: address });

      if (response.status === 200 || response.status === 201) {
        setAuthState((prev) => ({
          ...prev,
          walletExist: true,
          isLoading: false,
        }));
        return true;
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.data.error || '지갑 주소 등록 중 오류가 발생했습니다',
        }));
        return false;
      }
    } catch (error: any) {
      console.error('지갑 등록 오류:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || '지갑 주소 등록 중 오류가 발생했습니다',
      }));
      return false;
    }
  };

  /**
   * 로그인 함수 - 메타마스크 지갑으로 서명하여 인증
   * @param signer ethers.js의 JsonRpcSigner 객체
   */
  const login = async (signer?: ethers.JsonRpcSigner) => {
    const signerToUse = signer || authState.signer;

    if (!signerToUse) {
      setAuthState((prev) => ({
        ...prev,
        error: '연결된 지갑이 없습니다',
      }));
      return false;
    }

    setAuthState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const address = await signerToUse.getAddress();

      const nonce = await requestNonce(address);

      const signature = await signerToUse.signMessage(nonce);

      const { success, token } = await verifySignature(address, signature);

      if (token) {
        setAuthToken(token);
      }

      if (success) {
        try {
          const userResponse = await api.get('/api/auth/me');

          if (userResponse.data && userResponse.data.user) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              error: null,
              walletExist: true,
              user: userResponse.data.user,
              signer: signerToUse,
            });
            return true;
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          throw error;
        }
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: '인증에 실패했습니다',
      }));
      return false;
    } catch (error: any) {
      console.error('인증 오류:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          '인증에 실패했습니다',
      }));

      return false;
    }
  };

  /**
   * 이미 인증된 사용자인지 확인 (JWT 토큰 검증)
   */
  const checkAuthStatus = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await api.get('/api/auth/me');

        if (response.data && response.data.user) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            walletExist: true,
            user: response.data.user,
            signer: null,
          });
        } else {
          throw new Error('User not found');
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);

        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          walletExist: false,
          user: null,
          signer: null,
        });
      }
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        walletExist: false,
        user: null,
        signer: null,
      });
    }
  };

  /**
   * 로그아웃 함수
   */
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');

      if (window.ethereum && window.ethereum.disconnect) {
        try {
          await window.ethereum.disconnect();
        } catch (error) {
          console.error('메타마스크 연결 해제 오류:', error);
        }
      }

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        walletExist: false,
        user: null,
        signer: null,
      });

      return true;
    } catch (error) {
      console.error('로그아웃 오류:', error);
      return false;
    }
  };

  return {
    ...authState,
    connectWallet,
    registerWalletAddress,
    login,
    logout,
  };
}
