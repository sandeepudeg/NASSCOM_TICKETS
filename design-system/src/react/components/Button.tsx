import React, { forwardRef } from 'react';
import { Button as AntdButton, ButtonProps as AntdButtonProps } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, transitions, focusRing } from '../styled';

export interface ButtonProps extends Omit<AntdButtonProps, 'size' | 'variant'> {
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Full width button
   */
  fullWidth?: boolean;
  /**
   * Loading state with custom spinner
   */
  isLoading?: boolean;
}

const StyledButton = designSystemStyled(AntdButton)<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all ${transitions.fast};
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  
  ${(props: ButtonProps & { theme: any }) => props.fullWidth && 'width: 100%;'}
  
  /* Size variants */
  ${(props: any) => {
    switch (props.size) {
      case 'small':
        return `
          height: 32px;
          padding: 0 ${spacing.sm(props)};
          font-size: 14px;
          border-radius: ${borderRadius.sm(props)};
        `;
      case 'large':
        return `
          height: 48px;
          padding: 0 ${spacing.lg(props)};
          font-size: 16px;
          border-radius: ${borderRadius.lg(props)};
        `;
      default: // medium
        return `
          height: 40px;
          padding: 0 ${spacing.base(props)};
          font-size: 15px;
          border-radius: ${borderRadius.base(props)};
        `;
    }
  }}
  
  /* Variant styles */
  ${(props: any) => {
    switch (props.variant) {
      case 'secondary':
        return `
          background-color: ${colors.surface(props)};
          color: ${colors.text(props)};
          border-color: ${colors.border(props)};
          
          &:hover:not(:disabled) {
            background-color: ${colors.background2(props)};
            border-color: ${colors.primary(props)};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.background3(props)};
          }
        `;
      case 'outline':
        return `
          background-color: transparent;
          color: ${colors.primary(props)};
          border-color: ${colors.primary(props)};
          
          &:hover:not(:disabled) {
            background-color: ${colors.primary(props)}10;
            border-color: ${colors.primary(props)};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.primary(props)}20;
          }
        `;
      case 'ghost':
        return `
          background-color: transparent;
          color: ${colors.text(props)};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${colors.surface(props)};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.background2(props)};
          }
        `;
      case 'danger':
        return `
          background-color: ${colors.danger(props)};
          color: white;
          border-color: ${colors.danger(props)};
          
          &:hover:not(:disabled) {
            background-color: ${colors.danger(props)}dd;
            border-color: ${colors.danger(props)}dd;
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.danger(props)}bb;
          }
        `;
      default: // primary
        return `
          background-color: ${colors.primary(props)};
          color: white;
          border-color: ${colors.primary(props)};
          
          &:hover:not(:disabled) {
            background-color: ${colors.primary(props)}dd;
            border-color: ${colors.primary(props)}dd;
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.primary(props)}bb;
          }
        `;
    }
  }}
  
  /* Focus styles */
  &:focus-visible {
    ${focusRing}
  }
  
  /* Disabled styles */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Loading styles */
  ${(props: any) => props.isLoading && `
    cursor: wait;
    opacity: 0.8;
  `}
`;

/**
 * Enhanced Button component that extends Ant Design Button with design system tokens
 */
export const Button = forwardRef<any, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  loading,
  children,
  ...props
}, ref) => {
  // Map our size prop to Ant Design size
  const antdSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle';
  
  // Use isLoading or loading prop
  const isButtonLoading = !!(isLoading || loading);
  
  return (
    <StyledButton
      ref={ref}
      size={antdSize}
      loading={isButtonLoading}
      variant={variant}
      fullWidth={fullWidth}
      isLoading={isButtonLoading}
      {...props}
    >
      {children}
    </StyledButton>
  );
});

Button.displayName = 'Button';

export default Button;