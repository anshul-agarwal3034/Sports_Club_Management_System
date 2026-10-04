import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs ${className}`}>
      {icon && (
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#eff4ff] border border-[#bfdbfe]/60 flex items-center justify-center text-[#006c49]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[#0b1c30]">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-8 h-8 border-3 border-[#006c49]/20 border-t-[#006c49] rounded-full animate-spin mb-3" />
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
};
