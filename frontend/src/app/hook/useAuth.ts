import { useState, useEffect, FormEvent } from 'react';
import { ethers } from 'ethers';
import api, { setAuthToken, removeAuthToken } from '../../lib/axios';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  walletExist: boolean;
  user: {
    id: number | null;
    walletAddress: string;
    userId?: string | number;
    friendlyId?: string;
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
   * 캐릭터 생성 함수
   * @param characterData 캐릭터 정보
   */
  const createCharacter = async (characterData: any) => {
    if (!authState.user) {
      console.error('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await api.post('/api/characters', {
        ...characterData,
        userId: authState.user.id, // 유저 ID 포함
      });

      console.log('캐릭터 생성 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('캐릭터 생성 오류:', error);
    }
  };

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
    } catch (error: any) {
      console.error('서명 검증 중 오류:', error);

      // nonce 갱신이 필요한 경우 처리
      if (error.response?.data?.renewNonce) {
        console.log('nonce 갱신 필요, 다시 nonce 요청');
        // nonce를 다시 요청하고 새 값 반환
        const newNonce = await requestNonce(address);
        throw new Error('nonce가 갱신되었습니다. 다시 로그인해주세요.');
      }

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
            user: prev.user
              ? { ...prev.user, walletAddress: address }
              : {
                  id: null,
                  walletAddress: address,
                  userId: undefined,
                  friendlyId: undefined,
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
              user: prev.user
                ? { ...prev.user, walletAddress: address }
                : {
                    id: null,
                    walletAddress: address,
                    userId: undefined,
                    friendlyId: undefined,
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

      // nonce 요청 시도 (최대 3회)
      let nonce;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          nonce = await requestNonce(address);
          if (nonce) break;
        } catch (nonceError) {
          console.error(
            `nonce 요청 실패 (시도 ${retryCount + 1}/${maxRetries})`,
            nonceError,
          );
          retryCount++;
          if (retryCount >= maxRetries) throw nonceError;
          // 잠시 대기 후 재시도
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!nonce) {
        throw new Error('nonce를 가져오지 못했습니다');
      }

      const signature = await signerToUse.signMessage(nonce);

      const { success, token } = await verifySignature(address, signature);

      if (token) {
        setAuthToken(token);
      }

      if (success) {
        try {
          const userResponse = await api.get('/api/auth/me');

          if (userResponse.data && userResponse.data.user) {
            // If the user has a friendlyId, store it in localStorage
            if (userResponse.data.user.friendlyId) {
              localStorage.setItem(
                'friendlyId',
                userResponse.data.user.friendlyId,
              );
            }

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
        console.log('📌 /api/auth/me 응답:', response.data);
        if (response.data && response.data.user) {
          // Store or update friendlyId in localStorage
          if (response.data.user.friendlyId) {
            localStorage.setItem('friendlyId', response.data.user.friendlyId);
          }

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
        console.error('❌ 인증 상태 확인 오류:', error);

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

      // Remove friendlyId from localStorage
      localStorage.removeItem('friendlyId');

      // Remove auth token
      removeAuthToken();

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
    createCharacter,
  };
}
