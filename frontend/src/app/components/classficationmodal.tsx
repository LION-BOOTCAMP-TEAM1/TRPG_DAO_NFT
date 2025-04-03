'use client';

import { FC, ReactNode, useState, useRef } from 'react';

interface ModalProps {
  trigger: ReactNode;
  children: ReactNode;
  isDarkMode: boolean;
  position?: string;
}

const ClassModal: FC<ModalProps> = ({
  trigger,
  children,
  isDarkMode,
  position,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 50);
  };

  return (
    <div>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {trigger}
      </div>

      {isVisible && (
        <div
          className={`absolute ${position} p-4 rounded-lg shadow-lg border border-gray-100 z-50 ${isDarkMode ? 'bg-white text-black border-gray-200' : 'bg-white text-black'}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
          <div className="flex justify-center items-center mt-4">
            <button
              className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 cursor-pointer text-xs"
              onClick={() => setIsVisible(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassModal;
