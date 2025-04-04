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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  const shortAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center">
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
            onClick={handleLogout}
            className={`${buttonClassName} text-xs w-20`}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
