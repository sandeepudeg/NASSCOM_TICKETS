import React, { useState } from 'react';

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ripple?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  ripple = true,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-semibold rounded-md',
    'transition-all duration-250 ease-smooth',
    'transform-gpu will-animate',
    'focus:outline-none focus-ring',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    ripple ? 'btn-ripple' : '',
    'hover-lift press-scale'
  ].filter(Boolean).join(' ');

  const variantClasses = {
    primary: 'bg-primary text-white border border-primary hover:bg-primaryDark hover:shadow-lg',
    secondary: 'bg-transparent text-text-primary border border-border-primary hover:border-primary hover:text-primary',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
    ghost: 'bg-transparent text-text-primary hover:bg-background-secondary'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onClick?.(e);
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isPressed ? 'scale-98' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && (
        <div className="mr-2">
          <div className="spinner spinner-sm" />
        </div>
      )}
      {children}
    </button>
  );
};

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  position = 'bottom-right',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <button
      className={`
        ${positionClasses[position]}
        w-14 h-14 bg-primary text-white rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-250 ease-spring
        hover:scale-110 hover:shadow-xl hover-glow
        focus:outline-none focus-ring
        active:scale-95
        transform-gpu will-animate
        z-50
        ${className}
      `}
      {...props}
    >
      {icon}
    </button>
  );
};