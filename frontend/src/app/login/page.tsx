'use client';

/**const API_URL = 'localhost:5001'
`${API_URL}` */

import Link from 'next/link';

import { useEffect } from 'react';
import useWallet from '../hook/useWallet';

export default function LoginClient() {
  const {
    connectWallet,
    registerWalletAddress,
    disconnect,
    signer,
    walletExist,
    loading,
  } = useWallet();

  useEffect(() => {
    if (!signer) return;
  }, [signer]);

  return (
    <div>
      {/* 로그인 페이지 이미지 */}
      <div className="absolute z-2 imgst">
        <img src="/image.png" alt="Background" />
      </div>

      {/* 로그인 페이지 텍스트 */}
      <div className="homest">
        <h1 className="text-5xl font-bold italic text-center ">
          Another World Adventure
        </h1>
        <p className="mt-4 text-center font-bold italic text-2xl">
          Welcome to the TRPG DAO NFT project.
        </p>
      </div>

      {/* 로그인 + 스타트 */}
      <div className="LoginStyleWhite  top-6/10 left-1/2">
        <h1 className="text-6xl font-bold italic ">
          {signer ? (
            <Link
              href="/start"
              className="cursor-pointer hover:text-yellow-500"
            >
              {walletExist && signer && <p>Start</p>}
            </Link>
          ) : (
            'Login'
          )}
        </h1>
      </div>

      {/* 지갑 등록 후 */}
      {signer ? (
        <div>
          <div className="LoginStyleTeal top-13/15 left-1/2">
            <button
              className="text-2xl cursor-pointer font-bold italic hover:underline"
              onClick={disconnect}
            >
              Disconncet Wallet
            </button>
          </div>
          {walletExist && signer && (
            <div className="LoginStyleTeal top-17/25 left-1/2">
              <p className="LoginStyleTeal text-2xl font-bold italic">
                Adventurer:
              </p>
            </div>
          )}
          <div className="LoginStyleWhite  top-12/17 left-1/2">
            <p className="text-2xl  font-bold italic">
              {signer.address.substring(0, 7)}...
              {signer.address.substring(signer.address.length - 5)}
            </p>
          </div>
        </div>
      ) : (
        <div className="LoginStyleTeal   top-10/15 left-1/2">
          <form onSubmit={connectWallet}>
            <button className="text-4xl cursor-pointer font-bold italic">
              Connect Wallet
            </button>
          </form>
        </div>
      )}

      {/* 지갑 등록 전 */}
      {!walletExist && signer && (
        <div
          className="LoginStyleTeal top-6/10 left-1/2"
          style={{ fontFamily: 'continuous' }}
        >
          <button
            onClick={registerWalletAddress}
            disabled={loading}
            className={`text-6xl font-bold hover:text-teal-600 ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </div>
      )}

      {/*Footer*/}
      <footer className="LoginStyleWhite top-99/100 left-1/2  gap-4">
        <p>LLB6&copy;2025 </p>
        <button className="cursor-pointer">·Privacy</button>
        <button className="cursor-pointer">·Cookies</button>
        <button className="cursor-pointer">·Terms</button>
        <button className="cursor-pointer">·Risk</button>
        <button className="cursor-pointer">·About us</button>
      </footer>
    </div>
  );
}
