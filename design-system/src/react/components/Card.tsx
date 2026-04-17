import React, { forwardRef, ReactNode } from 'react';
import { Card as AntdCard, CardProps as AntdCardProps } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, shadows, transitions } from '../styled';

export interface CardProps extends Omit<AntdCardProps, 'size' | 'variant'> {
  /**
   * Card variant
   */
  variant?: 'default' | 'outlined' | 'filled' | 'elevated';
  /**
   * Card size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Interactive card (hover effects)
   */
  interactive?: boolean;
  /**
   * Card padding
   */
  padding?: 'none' | 'small' | 'medium' | 'large';
  /**
   * Custom header content
   */
  header?: ReactNode;
  /**
   * Custom footer content
   */
  footer?: ReactNode;
}

const StyledCard = designSystemStyled(AntdCard)<CardProps>`
  transition: all ${transitions.normal};
  border: 1px solid ${colors.border};
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'outlined':
        return `
          background-color: ${colors.background(props)};
          border-color: ${colors.border(props)};
          box-shadow: none;
        `;
      case 'filled':
        return `
          background-color: ${colors.surface(props)};
          border-color: transparent;
          box-shadow: none;
        `;
      case 'elevated':
        return `
          background-color: ${colors.background(props)};
          border-color: transparent;
          box-shadow: ${shadows.large(props)};
        `;
      default: // default
        return `
          background-color: ${colors.background(props)};
          border-color: ${colors.border(props)};
          box-shadow: ${shadows.small(props)};
        `;
    }
  }}
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          border-radius: ${borderRadius.sm(props)};
          
          .ant-card-body {
            padding: ${spacing.sm(props)};
          }
          
          .ant-card-head {
            padding: ${spacing.sm(props)};
            min-height: auto;
          }
        `;
      case 'large':
        return `
          border-radius: ${borderRadius.xl(props)};
          
          .ant-card-body {
            padding: ${spacing.xl(props)};
          }
          
          .ant-card-head {
            padding: ${spacing.xl(props)} ${spacing.xl(props)} 0;
          }
        `;
      default: // medium
        return `
          border-radius: ${borderRadius.lg(props)};
          
          .ant-card-body {
            padding: ${spacing.lg(props)};
          }
          
          .ant-card-head {
            padding: ${spacing.lg(props)} ${spacing.lg(props)} 0;
          }
        `;
    }
  }}
  
  /* Padding override */
  ${props => {
    if (props.padding === 'none') {
      return `
        .ant-card-body {
          padding: 0;
        }
      `;
    }
    if (props.padding === 'small') {
      return `
        .ant-card-body {
          padding: ${spacing.sm(props)};
        }
      `;
    }
    if (props.padding === 'large') {
      return `
        .ant-card-body {
          padding: ${spacing.xl(props)};
        }
      `;
    }
  }}
  
  /* Interactive styles */
  ${props => props.interactive && `
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${shadows.large(props)};
      border-color: ${colors.primary(props)};
    }
    
    &:active {
      transform: translateY(0);
    }
  `}
  
  /* Card header styles */
  .ant-card-head {
    border-bottom: 1px solid ${colors.border};
    background-color: transparent;
    
    .ant-card-head-title {
      color: ${colors.text};
      font-weight: 600;
    }
  }
  
  /* Card body styles */
  .ant-card-body {
    color: ${colors.text};
  }
  
  /* Card actions styles */
  .ant-card-actions {
    border-top: 1px solid ${colors.border};
    background-color: ${colors.surface};
    
    > li {
      margin: 0;
      
      > span {
        color: ${colors.text};
        
        &:hover {
          color: ${colors.primary};
        }
      }
    }
  }
`;

const CardHeader = designSystemStyled.div<{ size?: 'small' | 'medium' | 'large' }>`
  padding: ${props => {
    switch (props.size) {
      case 'small': return spacing.sm(props);
      case 'large': return spacing.xl(props);
      default: return spacing.lg(props);
    }
  }};
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surface};
  font-weight: 600;
  color: ${colors.text};
`;

const CardFooter = designSystemStyled.div<{ size?: 'small' | 'medium' | 'large' }>`
  padding: ${props => {
    switch (props.size) {
      case 'small': return spacing.sm(props);
      case 'large': return spacing.xl(props);
      default: return spacing.lg(props);
    }
  }};
  border-top: 1px solid ${colors.border};
  background-color: ${colors.surface};
  color: ${colors.text};
`;

/**
 * Enhanced Card component that extends Ant Design Card with design system tokens
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  size = 'medium',
  interactive = false,
  padding,
  header,
  footer,
  children,
  title,
  ...props
}, ref) => {
  // Combine title and header
  const cardTitle = header ? (
    <CardHeader size={size}>{header}</CardHeader>
  ) : title;
  
  // Add footer if provided
  const cardExtra = footer ? (
    <CardFooter size={size}>{footer}</CardFooter>
  ) : undefined;
  
  return (
    <StyledCard
      ref={ref}
      title={cardTitle}
      variant={variant}
      size={size}
      interactive={interactive}
      padding={padding}
      {...props}
    >
      {children}
      {cardExtra}
    </StyledCard>
  );
});

Card.displayName = 'Card';

export default Card;