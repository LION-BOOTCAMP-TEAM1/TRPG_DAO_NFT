import { ethers, JsonRpcSigner } from 'ethers';
import { FormEvent, useState } from 'react';

export default function useWallet() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [walletExist, setWalletExist] = useState(false);
  const [loading, setLoading] = useState(false);

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
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

  const disconnect = () => setSigner(null);

  return {
    connectWallet,
    registerWalletAddress,
    disconnect,
    signer,
    walletExist,
    loading,
  };
}
