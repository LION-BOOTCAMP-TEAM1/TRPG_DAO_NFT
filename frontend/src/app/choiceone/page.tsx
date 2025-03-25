'use client';

import { useEffect, useState } from 'react';

interface BranchPointScene {
  id: number;
  branchPointId: number;
  order: number;
  text: string;
}

const BranchPointScenes = () => {
  const [scenes, setScenes] = useState<BranchPointScene[]>([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/branchPointScenes')
      .then((response) => response.json())
      .then((data) => setScenes(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="flex justify-center items-center">
      <img src="/background.png" className="bgs" />

      <div
        className="absolute top-10 text-7xl drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.5)] "
        style={{ fontFamily: 'continuous' }}
      >
        <h2>The beginning of fate</h2>
      </div>

      <div className="absolute top-1/7 ">
        <img src="/choiceone/1.png" className="w-400" />
      </div>

      {scenes.map((scene) => (
        <div key={scene.id}>
          <h3>{scene.text}</h3>
        </div>
      ))}
    </div>
  );
};

export default BranchPointScenes;
