import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-surface-dark rounded-[24px] p-5 shadow-soft border border-white/5 relative overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-3">
          {icon}
          {title && <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};
