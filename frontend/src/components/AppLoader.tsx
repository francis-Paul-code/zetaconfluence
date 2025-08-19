import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const AppLoader = () => {
  return (
    <div
      className="fixed inset-0 bg-[#23387650] backdrop-blur-xs flex items-center justify-center z-[10000]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center px-5 py-4 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400/70 z-[11000]">
        <span className="size-[25px] overflow-hidden flex items-center justify-center animate-spin mr-2">
          <AiOutlineLoading3Quarters size="100%" />
        </span>
        <p>processing...</p>
      </div>
    </div>
  );
};

export default AppLoader;
