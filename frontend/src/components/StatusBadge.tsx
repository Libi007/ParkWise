import React from 'react';
import { ParkingStatus } from '../types';
import { getStatusTheme } from '../utils/formatters';

interface StatusBadgeProps {
  status: ParkingStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const theme = getStatusTheme(status);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs sm:text-sm px-3 py-1',
    lg: 'text-sm font-bold px-3.5 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md shadow-sm font-medium ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`h-2 w-2 rounded-full ${theme.barColor} animate-pulse`}
        />
      )}
      {status}
    </span>
  );
};
