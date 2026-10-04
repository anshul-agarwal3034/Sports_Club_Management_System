import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-[#006c49] text-white hover:bg-[#005237] active:bg-[#00402b] focus:ring-[#006c49] shadow-sm',
    secondary:
      'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff] focus:ring-[#1e40af] border border-[#bfdbfe]/50',
    outline:
      'bg-white text-[#0b1c30] border border-[#cbd5e1] hover:bg-[#f8f9ff] hover:border-[#94a3b8] focus:ring-[#006c49] shadow-sm',
    danger:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 focus:ring-rose-500',
    ghost:
      'text-[#475569] hover:text-[#0b1c30] hover:bg-slate-100 focus:ring-slate-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
