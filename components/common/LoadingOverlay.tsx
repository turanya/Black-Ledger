
import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-xl font-serif-display text-amber-100">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
