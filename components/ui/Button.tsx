import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-bold rounded-[20px] transition-all active:scale-[0.98] flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#B04E75] hover:bg-[#9c4266] text-white shadow-xl shadow-[#B04E75]/20",
    secondary: "bg-surface-dark hover:bg-white/10 text-white border border-white/10",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white",
    icon: "rounded-full aspect-square p-2 bg-white dark:bg-white/10 text-[#121014] dark:text-white border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/20"
  };

  const sizes = {
    sm: "py-2 px-4 text-xs",
    md: "py-3 px-6 text-sm",
    lg: "py-4 px-8 text-base"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${variant !== 'icon' ? sizes[size] : ''} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      {children}
    </button>
  );
};
