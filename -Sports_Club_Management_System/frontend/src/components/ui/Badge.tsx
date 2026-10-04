import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'amber' | 'slate' | 'rose' | 'purple' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'sm',
  icon,
  className = '',
}) => {
  const variants = {
    emerald: 'bg-[#ecfdf5] text-[#006c49] border-[#a7f3d0]',
    blue: 'bg-[#eff4ff] text-[#1d4ed8] border-[#bfdbfe]',
    amber: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
    slate: 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]',
    rose: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
    purple: 'bg-[#faf5ff] text-[#6b21a8] border-[#e9d5ff]',
    outline: 'bg-transparent text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
