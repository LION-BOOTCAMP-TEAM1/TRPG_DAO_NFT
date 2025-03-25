'use client';

/**const API_URL = 'localhost:5001'
`${API_URL}` */

import { ethers, JsonRpcSigner } from 'ethers';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function LoginClient() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [walletExist, setWalletExist] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //Wallet Address Read
  const connectWallet = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await provider.getSigner();
      setSigner(newSigner);

      const address = await newSigner.getAddress();
      console.log('wallet address', address);

      const response = await fetch('http://localhost:5001/api/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });

      if (response.ok) {
        const users = await response.json();
        const userExist = users.some(
          (user: { walletAddress: string }) => user.walletAddress === address,
        );

        setWalletExist(userExist);
        alert('Success Connect!');
      } else {
        const data = await response.json();
        alert('Failed to save wallet address: ' + data.error);
      }
    } catch (error) {
      console.error('Metamask connecting Error', error);
    }
  };

  //Wallet Address Register
  const registerWalletAddress = async () => {
    if (!signer) return;

    setLoading(true);
    const address = await signer.getAddress();

    try {
      const response = await fetch('http://localhost:5001/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });

      if (response.ok) {
        alert('Wallet Address Successfully Resistered.');
        setWalletExist(true);
      } else {
        const data = await response.json();
        alert('Failed to Register Wallet Address.' + data.error);
        console.log(data);
      }
    } catch (error) {
      console.error('Registering Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconncet = () => setSigner(null);

  useEffect(() => {
    if (!signer) return;
  }, [signer]);

  return (
    <div>
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

      {signer ? (
        <div>
          <div className="LoginStyleTeal top-13/15 left-1/2">
            <button
              className="text-2xl cursor-pointer font-bold italic hover:underline"
              onClick={disconncet}
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
