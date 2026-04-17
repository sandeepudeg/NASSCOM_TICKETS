import React, { useState, useRef, useEffect } from 'react';

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  describedBy?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  children,
  className = '',
  disabled,
  onClick,
  ariaLabel,
  ariaDescribedBy,
  pressed,
  expanded,
  controls,
  describedBy,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ensure minimum touch target size
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-semibold rounded-md',
    'transition-all duration-250 ease-smooth',
    'focus:outline-none focus-visible:outline-3 focus-visible:outline-primary focus-visible:outline-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'min-h-[44px] min-w-[44px]', // WCAG touch target size
    'relative'
  ].filter(Boolean).join(' ');

  const variantClasses = {
    primary: 'bg-primary text-white border border-primary hover:bg-primaryDark hover:shadow-lg',
    secondary: 'bg-transparent text-text-primary border border-border-primary hover:border-primary hover:text-primary',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
    ghost: 'bg-transparent text-text-primary hover:bg-background-secondary',
    danger: 'bg-danger text-white border border-danger hover:bg-red-600 hover:shadow-lg'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px] min-w-[32px]',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Handle space and enter keys
    if (e.key === ' ' || e.key === 'Enter') {
      setIsPressed(true);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      setIsPressed(false);
    }
  };

  // Generate accessible description
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (loading) return loadingText;
    if (typeof children === 'string') return children;
    return undefined;
  };

  return (
    <button
      ref={buttonRef}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isPressed ? 'scale-98' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label={getAriaLabel()}
      aria-describedby={ariaDescribedBy || describedBy}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <>
          <div className="mr-2" aria-hidden="true">
            <div className="spinner spinner-sm" />
          </div>
          <span className="sr-only">{loadingText}</span>
        </>
      )}
      <span aria-hidden={loading ? 'true' : 'false'}>
        {children}
      </span>
    </button>
  );
};

export interface AccessibleIconButtonProps extends Omit<AccessibleButtonProps, 'children'> {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
}

export const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  label,
  tooltip,
  className = '',
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative inline-block">
      <AccessibleButton
        className={`p-2 ${className}`}
        ariaLabel={label}
        ariaDescribedBy={tooltip ? tooltipId : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
      </AccessibleButton>
      
      {tooltip && showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm bg-gray-900 text-white rounded whitespace-nowrap z-50"
        >
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export interface AccessibleToggleButtonProps extends AccessibleButtonProps {
  pressed: boolean;
  onToggle: (pressed: boolean) => void;
  pressedLabel?: string;
  unpressedLabel?: string;
}

export const AccessibleToggleButton: React.FC<AccessibleToggleButtonProps> = ({
  pressed,
  onToggle,
  pressedLabel,
  unpressedLabel,
  children,
  ...props
}) => {
  const handleClick = () => {
    onToggle(!pressed);
  };

  const getLabel = () => {
    if (pressed && pressedLabel) return pressedLabel;
    if (!pressed && unpressedLabel) return unpressedLabel;
    return undefined;
  };

  return (
    <AccessibleButton
      pressed={pressed}
      onClick={handleClick}
      ariaLabel={getLabel()}
      className={pressed ? 'bg-primary text-white' : ''}
      {...props}
    >
      {children}
    </AccessibleButton>
  );
};