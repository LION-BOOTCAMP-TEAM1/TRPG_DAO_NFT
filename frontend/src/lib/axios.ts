import axios from 'axios';

const api = axios.create({
  baseURL: 'https://trpg-dao-nft.onrender.com',
});

export default api;
