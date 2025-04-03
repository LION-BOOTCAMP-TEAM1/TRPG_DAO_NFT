import { useState } from 'react';
import api from '@/lib/axios';
import { User } from '../types/chapter';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const getConnectedWallet = async (): Promise<string> => {
    const [address] = await (window as any).ethereum.request({
      method: 'eth_requestAccounts',
    });
    console.log('[getConnectedWallet] wallet address:', address);
    return address;
  };

  const fetchAndSetCurrentUser = async () => {
    const wallet = await getConnectedWallet();
    const res = await api.get('/api/users');
    const users: User[] = res.data;
    const matched = users.find(
      (u) => u.walletAddress.toLowerCase() === wallet.toLowerCase(),
    );
    console.log('[useCurrentUser] matched user:', matched);
    if (matched) setCurrentUser(matched);
  };

  return {
    currentUser,
    fetchAndSetCurrentUser,
  };
}
