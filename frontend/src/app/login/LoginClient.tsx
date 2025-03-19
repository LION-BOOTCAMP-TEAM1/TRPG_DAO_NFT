'use client';

/**const API_URL = 'localhost:5001'
`${API_URL}` */

import { ethers, JsonRpcSigner } from 'ethers';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

export default function LoginClient() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  // const [users, setUsers] = useState<any[]>([]);

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

      // setSigner(await provider.getSigner());

      const response = await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });

      if (response.ok) {
        alert('Wallet address successfully saved!');
      } else {
        const data = await response.json();
        alert('Failed to save wallet address: ' + data.error);
      }
    } catch (error) {
      console.error('Metamask connecting Error', error);
    }
  };

  const disconncet = () => setSigner(null);

  useEffect(() => {
    if (!signer) return;
  }, [signer]);

  return (
    <div>
      <div className="flex z-10 absolute top-6/10 left-1/2 transform -translate-x-1/2 -translate-y-1/2  justify-center align-center text-white drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)]">
        <h1 className="text-6xl font-bold italic ">
          {signer ? (
            <Link
              href="/start"
              className="cursor-pointer hover:text-yellow-500"
            >
              start
            </Link>
          ) : (
            'Login'
          )}
        </h1>
      </div>
      {signer ? (
        <div>
          <div className="flex z-10 absolute top-10/15 left-1/2 transform -translate-x-1/2 -translate-y-1/2  justify-center align-center  text-teal-400 drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)]">
            <button
              className="text-2xl cursor-pointer font-bold italic hover:underline"
              onClick={disconncet}
            >
              Disconncet Wallet
            </button>
          </div>
          <div className="flex z-10 absolute top-12/17 left-1/2 transform -translate-x-1/2 -translate-y-1/2  justify-center align-center  text-teal-400 drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)]">
            <p className="text-2xl  font-bold italic">
              {signer.address.substring(0, 7)}...
              {signer.address.substring(signer.address.length - 5)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex z-10 absolute top-10/15 left-1/2 transform -translate-x-1/2 -translate-y-1/2  justify-center align-center  text-teal-400 drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)]">
          <form onSubmit={connectWallet}>
            <button className="text-4xl cursor-pointer font-bold italic">
              Connect Wallet
            </button>
          </form>
        </div>
      )}

      <footer className="flex z-10 absolute top-99/100 left-1/2 transform -translate-x-1/2 -translate-y-1/2    text-white drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)] gap-4">
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
