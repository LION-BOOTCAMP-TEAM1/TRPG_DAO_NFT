import { FC, useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import useAuth from '../../hook/useAuth';

// get NFT
import { AppDispatch } from "@/store";
import { useDispatch } from "react-redux";
import {getNFTList} from '@/utils/web3';

interface LoginProps {
  onLoginSuccess?: () => void;
  buttonClassName?: string;
}

const Login: FC<LoginProps> = ({
  onLoginSuccess,
  buttonClassName = 'btn-primary',
}) => {
  const {
    connectWallet,
    login,
    logout,
    isAuthenticated,
    isLoading,
    error,
    user,
    signer,
  } = useAuth();

  const [isConnecting, setIsConnecting] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsConnecting(true);

    try {
      const connectedSigner = await connectWallet(e);
      
      getNFTList(dispatch);

      if (connectedSigner) {
        const success = await login(connectedSigner);
        if (success && onLoginSuccess) onLoginSuccess();
      }
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogoutButtonClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      setShowLogoutModal(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const shortAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center relative">
      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="flex">
          <button
            type="submit"
            className={`${buttonClassName}`}
            disabled={isLoading || isConnecting}
          >
            {isLoading || isConnecting ? (
              <span className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                연결중
              </span>
            ) : (
              <span className="inline-flex items-center">
                <FaWallet className="mr-1.5" size={14} />
                로그인
              </span>
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-fantasy-text dark:text-[var(--fantasy-text)] truncate max-w-[70px] flex items-center">
            <FaWallet
              className="mr-1 text-fantasy-gold dark:text-[var(--fantasy-gold)]"
              size={10}
            />
            {user?.friendlyId
              ? user.friendlyId
              : user?.walletAddress && shortAddress(user.walletAddress)}
          </span>
          <button
            onClick={handleLogoutButtonClick}
            className={`${buttonClassName} text-xs w-20`}
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">로그아웃 확인</h3>
            <p className="mb-6">정말 로그아웃 하시겠습니까?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleCancelLogout}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded"
              >
                취소
              </button>
              <button 
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
