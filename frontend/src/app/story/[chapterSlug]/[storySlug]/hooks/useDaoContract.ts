import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import DaoABI from '@/utils/abis/DAO.json';

export const useDaoContract = () => {
  const [dao, setDao] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instance = new ethers.Contract(
        '0x339B6a8D4D6CedB026088489eC10C919E1Cb4aB6',
        DaoABI,
        signer,
      );
      setDao(instance);
    };
    init();
  }, []);

  return dao;
};
