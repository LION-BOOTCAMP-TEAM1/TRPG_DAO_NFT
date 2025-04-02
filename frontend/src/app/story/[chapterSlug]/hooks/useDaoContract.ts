import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import DaoArtifact from '@/contracts/TRPG_DAO.json';
import daoAddress from '@/deployments/localDao.json';

export const useDaoContract = () => {
  const [dao, setDao] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instance = new ethers.Contract(
        daoAddress.address,
        DaoArtifact.abi,
        signer,
      );
      setDao(instance);
    };
    init();
  }, []);

  return dao;
};
