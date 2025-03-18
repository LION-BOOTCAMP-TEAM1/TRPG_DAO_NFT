'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5001/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Error connecting to backend: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!wallet.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      setWallet('');
      await fetchUsers(); // Refresh the user list
    } catch (err) {
      setError('Error creating user: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center">TRPG DAO NFT</h1>
        <p className="mt-4 text-center">Welcome to the TRPG DAO NFT project!</p>
        
        <div className="mt-8 p-6 border rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Backend Connection Test</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block mb-2">Add new wallet address:</label>
            <div className="flex">
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="flex-1 p-2 border rounded-l"
                placeholder="Enter wallet address"
              />
              <button
                onClick={createUser}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl">Users from Backend:</h3>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:bg-gray-100"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {users.length > 0 ? (
              <ul className="border rounded divide-y">
                {users.map((user: any) => (
                  <li key={user.id} className="p-2">
                    ID: {user.id} | Wallet: {user.walletAddress}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No users found</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
