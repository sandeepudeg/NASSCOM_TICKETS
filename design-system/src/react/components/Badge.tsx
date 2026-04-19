import React, { forwardRef, ReactNode } from 'react';
import { Badge as AntdBadge, BadgeProps as AntdBadgeProps } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, typography, transitions } from '../styled';

export interface BadgeProps extends Omit<AntdBadgeProps, 'size'> {
  /**
   * Badge variant
   */
  variant?: 'filled' | 'outlined' | 'dot' | 'subtle';
  /**
   * Badge size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Badge color theme
   */
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  /**
   * Custom color
   */
  customColor?: string;
  /**
   * Pulse animation
   */
  pulse?: boolean;
}

const StyledBadge = designSystemStyled(AntdBadge)<BadgeProps>`
  /* Badge content styling */
  .ant-badge-count,
  .ant-badge-dot {
    transition: all ${transitions.fast};
    
    ${(props: any) => {
      const getColorValue = (colorScheme: string) => {
        switch (colorScheme) {
          case 'primary': return colors.primary(props);
          case 'secondary': return colors.secondary(props);
          case 'success': return colors.success(props);
          case 'warning': return colors.warning(props);
          case 'danger': return colors.danger(props);
          case 'info': return colors.info(props);
          default: return colors.primary(props);
        }
      };
      
      const badgeColor = props.customColor || getColorValue(props.colorScheme || 'primary');
      
      switch (props.variant) {
        case 'outlined':
          return `
            background-color: ${colors.background(props)};
            border: 2px solid ${badgeColor};
            color: ${badgeColor};
          `;
        case 'subtle':
          return `
            background-color: ${badgeColor}20;
            border: 1px solid ${badgeColor}40;
            color: ${badgeColor};
          `;
        case 'dot':
          return `
            background-color: ${badgeColor};
            border: 2px solid ${colors.background(props)};
          `;
        default: // filled
          return `
            background-color: ${badgeColor};
            color: white;
            border: none;
          `;
      }
    }}
    
    /* Size variants */
    ${(props: any) => {
      switch (props.size) {
        case 'small':
          return `
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            font-size: 10px;
            line-height: 16px;
            border-radius: ${borderRadius.sm(props)};
          `;
        case 'large':
          return `
            min-width: 24px;
            height: 24px;
            padding: 0 8px;
            font-size: 14px;
            line-height: 24px;
            border-radius: ${borderRadius.base(props)};
          `;
        default: // medium
          return `
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            font-size: 12px;
            line-height: 20px;
            border-radius: ${borderRadius.sm(props)};
          `;
      }
    }}
    
    /* Pulse animation */
    ${(props: any) => props.pulse && `
      animation: badgePulse 2s ease-in-out infinite;
      
      @keyframes badgePulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `}
  }
  
  /* Dot variant specific styles */
  ${(props: any) => props.variant === 'dot' && `
    .ant-badge-dot {
      ${props.size === 'small' ? 'width: 6px; height: 6px;' : 
        props.size === 'large' ? 'width: 12px; height: 12px;' : 
        'width: 8px; height: 8px;'}
    }
  `}
  
  /* Status badge styles */
  .ant-badge-status-dot {
    ${(props: any) => {
      const getColorValue = (colorScheme: string) => {
        switch (colorScheme) {
          case 'primary': return colors.primary(props);
          case 'secondary': return colors.secondary(props);
          case 'success': return colors.success(props);
          case 'warning': return colors.warning(props);
          case 'danger': return colors.danger(props);
          case 'info': return colors.info(props);
          default: return colors.primary(props);
        }
      };
      
      const badgeColor = props.customColor || getColorValue(props.colorScheme || 'primary');
      
      return `
        background-color: ${badgeColor};
        ${props.size === 'small' ? 'width: 6px; height: 6px;' : 
          props.size === 'large' ? 'width: 12px; height: 12px;' : 
          'width: 8px; height: 8px;'}
      `;
    }}
  }
  
  .ant-badge-status-text {
    color: ${(props: any) => colors.text(props)};
    font-size: ${(props: any) => 
      props.size === 'small' ? '12px' : 
      props.size === 'large' ? '16px' : '14px'
    };
    margin-left: ${(props: any) => spacing.xs(props)};
  }
`;

/**
 * Enhanced Badge component that extends Ant Design Badge with design system tokens
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'filled',
  size = 'medium',
  colorScheme = 'primary',
  customColor,
  pulse = false,
  color,
  ...props
}, ref) => {
  // Use customColor or colorScheme to set the color
  const badgeColor = customColor || color;
  
  return (
    <StyledBadge
      ref={ref}
      variant={variant}
      size={size as any}
      colorScheme={colorScheme}
      customColor={badgeColor}
      pulse={pulse}
      color={badgeColor}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

// Status Badge component for status indicators
export interface StatusBadgeProps {
  /**
   * Status type
   */
  status: 'online' | 'offline' | 'busy' | 'away' | 'success' | 'warning' | 'error' | 'info';
  /**
   * Status text
   */
  text?: string;
  /**
   * Badge size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Pulse animation
   */
  pulse?: boolean;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(({
  status,
  text,
  size = 'medium',
  pulse = false,
}, ref) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'success':
        return 'success';
      case 'busy':
      case 'error':
        return 'danger';
      case 'away':
      case 'warning':
        return 'warning';
      case 'offline':
        return 'secondary';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  };
  
  return (
    <Badge
      ref={ref}
      status="default"
      text={text}
      variant="dot"
      size={size}
      colorScheme={getStatusColor(status)}
      pulse={pulse}
    />
  );
});

StatusBadge.displayName = 'StatusBadge';

// Attach StatusBadge to Badge for convenience
(Badge as any).Status = StatusBadge;

export default Badge;