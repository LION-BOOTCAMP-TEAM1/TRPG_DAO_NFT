'use client';

import { FC, ReactNode, useState, useRef } from 'react';

interface ModalProps {
  trigger: ReactNode; // 모달을 여는 트리거 요소
  children: ReactNode; // 모달 내부에 들어갈 내용
  isDarkMode: boolean;
}

const Modal: FC<ModalProps> = ({ trigger, children, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 10);
  };

  return (
    <div>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {trigger}
      </div>

      {isVisible && (
        <div
          className={`fixed top-20 right-30 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 ${isDarkMode ? 'bg-gray-800 text-black border-gray-600' : 'bg-white text-black'}`}
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

export default Modal;
