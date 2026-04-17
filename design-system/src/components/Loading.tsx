import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : 
                   size === 'lg' ? 'spinner-lg' : 
                   size === 'xl' ? 'spinner-xl' : '';
  
  return (
    <div 
      className={`spinner ${sizeClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface SkeletonProps {
  variant?: 'text' | 'avatar' | 'button' | 'custom';
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  variant = 'text',
  width,
  height,
  className = '' 
}) => {
  const variantClass = variant === 'text' ? 'skeleton-text' :
                      variant === 'avatar' ? 'skeleton-avatar' :
                      variant === 'button' ? 'skeleton-button' : '';
  
  const style = {
    ...(width && { width }),
    ...(height && { height })
  };
  
  return (
    <div 
      className={`skeleton ${variantClass} ${className}`}
      style={style}
      aria-label="Loading content"
    />
  );
};

export interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value = 0,
  indeterminate = false,
  className = '' 
}) => {
  return (
    <div 
      className={`progress-bar ${indeterminate ? 'progress-bar-indeterminate' : ''} ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className="progress-bar-fill"
        style={{ width: indeterminate ? undefined : `${value}%` }}
      />
    </div>
  );
};

export interface LoadingOverlayProps {
  visible: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible,
  children,
  className = '' 
}) => {
  if (!visible) return null;
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn ${className}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl animate-scaleIn">
        {children || <Spinner size="lg" />}
      </div>
    </div>
  );
};