
import React from 'react';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({ children, className = '', onClick, isHighlighted }) => {
  const baseClasses = "bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 md:p-6 transform transition-all duration-300 ease-out";
  const hoverClasses = onClick ? "hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer" : "";
  const highlightClasses = isHighlighted ? "ring-2 ring-amber-500 dark:ring-amber-400 shadow-2xl scale-105" : "shadow-md";
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${highlightClasses} ${className} animate-fade-in`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default InteractiveCard;
