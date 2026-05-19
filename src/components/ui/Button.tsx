import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/10 focus:ring-2 focus:ring-blue-500/20',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-2 focus:ring-slate-150',
    danger: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 active:bg-red-200 focus:ring-2 focus:ring-red-500/10',
    ghost: 'shadow-none border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200 focus:ring-2 focus:ring-slate-150',
  };

  const sizes = {
    default: 'h-10 px-4 text-sm',
    sm: 'h-[34px] px-3 text-xs rounded-lg',
  };

  const selectedVariant = variants[variant];
  const selectedSize = sizes[size];

  return (
    <button
      className={`${baseStyle} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
