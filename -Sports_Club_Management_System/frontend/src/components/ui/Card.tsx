import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  padded?: boolean | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  padded = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    false: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    true: 'p-6',
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${paddingStyles[String(padded) as keyof typeof paddingStyles]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
