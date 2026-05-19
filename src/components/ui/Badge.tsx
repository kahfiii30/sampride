import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
}) => {
  const styles = {
    primary: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    success: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    warning: 'bg-amber-50 text-amber-755 dark:bg-amber-950/30 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    info: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
  };

  const selectedStyle = styles[variant];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedStyle}`}>
      {children}
    </span>
  );
};
