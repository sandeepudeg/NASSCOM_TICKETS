import React, { forwardRef, ReactNode } from 'react';
import { Spin as AntdSpin, SpinProps as AntdSpinProps, Skeleton, SkeletonProps } from 'antd';
import { designSystemStyled, colors, spacing, transitions } from '../styled';

export interface LoadingProps extends Omit<AntdSpinProps, 'size'> {
  /**
   * Loading variant
   */
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  /**
   * Loading size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Loading text
   */
  text?: string;
  /**
   * Center the loading indicator
   */
  centered?: boolean;
  /**
   * Full screen overlay
   */
  overlay?: boolean;
  /**
   * Custom color
   */
  color?: string;
}

export interface SkeletonLoadingProps extends SkeletonProps {
  /**
   * Skeleton variant
   */
  variant?: 'text' | 'card' | 'list' | 'avatar' | 'button' | 'input';
  /**
   * Number of lines for text skeleton
   */
  lines?: number;
}

const StyledLoading = designSystemStyled(AntdSpin)<LoadingProps>`
  /* Custom spinner styles */
  .ant-spin-dot {
    ${props => props.color && `
      .ant-spin-dot-item {
        background-color: ${props.color};
      }
    `}
  }
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          .ant-spin-dot {
            font-size: 16px;
          }
          
          .ant-spin-text {
            font-size: 14px;
            margin-top: ${spacing.xs(props)};
          }
        `;
      case 'large':
        return `
          .ant-spin-dot {
            font-size: 32px;
          }
          
          .ant-spin-text {
            font-size: 18px;
            margin-top: ${spacing.sm(props)};
          }
        `;
      default: // medium
        return `
          .ant-spin-dot {
            font-size: 24px;
          }
          
          .ant-spin-text {
            font-size: 16px;
            margin-top: ${spacing.xs(props)};
          }
        `;
    }
  }}
  
  /* Centered variant */
  ${props => props.centered && `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  `}
  
  /* Overlay variant */
  ${props => props.overlay && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `}
  
  /* Text color */
  .ant-spin-text {
    color: ${colors.text};
  }
`;

// Custom loading indicators
const DotsIndicator = designSystemStyled.div<{ size?: string; color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  .dot {
    width: ${props => props.size === 'small' ? '6px' : props.size === 'large' ? '10px' : '8px'};
    height: ${props => props.size === 'small' ? '6px' : props.size === 'large' ? '10px' : '8px'};
    border-radius: 50%;
    background-color: ${props => props.color || colors.primary(props)};
    animation: dotPulse 1.4s ease-in-out infinite both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
  
  @keyframes dotPulse {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const PulseIndicator = designSystemStyled.div<{ size?: string; color?: string }>`
  width: ${props => props.size === 'small' ? '24px' : props.size === 'large' ? '48px' : '32px'};
  height: ${props => props.size === 'small' ? '24px' : props.size === 'large' ? '48px' : '32px'};
  border-radius: 50%;
  background-color: ${props => props.color || colors.primary(props)};
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.3;
    }
    100% {
      transform: scale(0.8);
      opacity: 1;
    }
  }
`;

/**
 * Enhanced Loading component with multiple variants
 */
export const Loading = forwardRef<HTMLDivElement, LoadingProps>(({
  variant = 'spinner',
  size = 'medium',
  text,
  centered = false,
  overlay = false,
  color,
  spinning = true,
  children,
  ...props
}, ref) => {
  // Custom loading indicators
  const renderCustomIndicator = () => {
    switch (variant) {
      case 'dots':
        return <DotsIndicator size={size} color={color}><div className="dot" /><div className="dot" /><div className="dot" /></DotsIndicator>;
      case 'pulse':
        return <PulseIndicator size={size} color={color} />;
      case 'skeleton':
        return null; // Handled separately
      default:
        return undefined; // Use default Ant Design spinner
    }
  };
  
  // Handle skeleton variant separately
  if (variant === 'skeleton') {
    return <SkeletonLoading active />;
  }
  
  const customIndicator = renderCustomIndicator();
  
  const loadingContent = (
    <StyledLoading
      ref={ref}
      size={size === 'medium' ? 'default' : size}
      spinning={spinning}
      indicator={customIndicator}
      tip={text}
      centered={centered}
      overlay={overlay}
      color={color}
      {...props}
    >
      {children}
    </StyledLoading>
  );
  
  // Wrap in overlay if needed
  if (overlay && spinning) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
        {loadingContent}
      </div>
    );
  }
  
  return loadingContent;
});

Loading.displayName = 'Loading';

/**
 * Skeleton loading component for content placeholders
 */
export const SkeletonLoading = forwardRef<HTMLDivElement, SkeletonLoadingProps>(({
  variant = 'text',
  lines = 3,
  active = true,
  ...props
}, ref) => {
  const getSkeletonProps = () => {
    switch (variant) {
      case 'card':
        return {
          avatar: true,
          paragraph: { rows: 4 },
          title: true,
        };
      case 'list':
        return {
          avatar: true,
          paragraph: { rows: 2 },
          title: false,
        };
      case 'avatar':
        return {
          avatar: { size: 'large' as const },
          paragraph: false,
          title: false,
        };
      case 'button':
        return {
          paragraph: false,
          title: { width: 100 },
        };
      case 'input':
        return {
          paragraph: false,
          title: { width: '100%' },
        };
      default: // text
        return {
          paragraph: { rows: lines },
          title: false,
        };
    }
  };
  
  return (
    <Skeleton
      active={active}
      {...getSkeletonProps()}
      {...props}
    />
  );
});

SkeletonLoading.displayName = 'SkeletonLoading';

// Attach SkeletonLoading to Loading for convenience
(Loading as any).Skeleton = SkeletonLoading;

export default Loading;