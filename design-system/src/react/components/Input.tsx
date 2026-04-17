import React, { forwardRef } from 'react';
import { Input as AntdInput, InputProps as AntdInputProps } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, transitions, focusRing } from '../styled';

export interface InputProps extends Omit<AntdInputProps, 'size'> {
  /**
   * Input size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Input variant
   */
  variant?: 'default' | 'filled' | 'borderless';
  /**
   * Error state
   */
  error?: boolean;
  /**
   * Success state
   */
  success?: boolean;
}

const StyledInput = designSystemStyled(AntdInput)<InputProps>`
  transition: all ${transitions.fast};
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          .ant-input {
            height: 32px;
            padding: 0 ${spacing.sm(props)};
            font-size: 14px;
            border-radius: ${borderRadius.sm(props)};
          }
        `;
      case 'large':
        return `
          .ant-input {
            height: 48px;
            padding: 0 ${spacing.lg(props)};
            font-size: 16px;
            border-radius: ${borderRadius.lg(props)};
          }
        `;
      default: // medium
        return `
          .ant-input {
            height: 40px;
            padding: 0 ${spacing.base(props)};
            font-size: 15px;
            border-radius: ${borderRadius.base(props)};
          }
        `;
    }
  }}
  
  /* Variant styles */
  .ant-input {
    background-color: ${props => 
      props.variant === 'filled' ? colors.surface(props) : 
      props.variant === 'borderless' ? 'transparent' : colors.background(props)
    };
    border-color: ${colors.border};
    color: ${colors.text};
    
    ${props => props.variant === 'borderless' && 'border: none;'}
    
    &::placeholder {
      color: ${colors.textMuted};
    }
    
    &:hover {
      border-color: ${colors.primary};
    }
    
    &:focus,
    &:focus-within {
      border-color: ${colors.primary};
      box-shadow: 0 0 0 2px ${colors.primary}20;
      ${focusRing}
    }
  }
  
  /* Error state */
  ${props => props.error && `
    .ant-input {
      border-color: ${colors.danger(props)};
      
      &:hover,
      &:focus,
      &:focus-within {
        border-color: ${colors.danger(props)};
        box-shadow: 0 0 0 2px ${colors.danger(props)}20;
      }
    }
  `}
  
  /* Success state */
  ${props => props.success && `
    .ant-input {
      border-color: ${colors.success(props)};
      
      &:hover,
      &:focus,
      &:focus-within {
        border-color: ${colors.success(props)};
        box-shadow: 0 0 0 2px ${colors.success(props)}20;
      }
    }
  `}
  
  /* Disabled state */
  &.ant-input-disabled .ant-input {
    background-color: ${colors.background2};
    color: ${colors.textMuted};
    cursor: not-allowed;
  }
`;

/**
 * Enhanced Input component that extends Ant Design Input with design system tokens
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'medium',
  variant = 'default',
  error = false,
  success = false,
  status,
  ...props
}, ref) => {
  // Map our size prop to Ant Design size
  const antdSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle';
  
  // Determine status based on error/success props
  let inputStatus: "" | "warning" | "error" | undefined = status;
  if (error) inputStatus = 'error';
  // Note: Ant Design Input doesn't support 'success' status, so we handle it with custom styling
  
  return (
    <StyledInput
      ref={ref}
      size={antdSize}
      status={inputStatus}
      variant={variant}
      error={error}
      success={success}
      {...props}
    />
  );
});

Input.displayName = 'Input';

// Export TextArea component
const StyledTextArea = designSystemStyled(AntdInput.TextArea)<InputProps>`
  .ant-input {
    background-color: ${colors.background};
    border-color: ${colors.border};
    color: ${colors.text};
    border-radius: ${borderRadius.base};
    transition: all ${transitions.fast};
    
    &::placeholder {
      color: ${colors.textMuted};
    }
    
    &:hover {
      border-color: ${colors.primary};
    }
    
    &:focus,
    &:focus-within {
      border-color: ${colors.primary};
      box-shadow: 0 0 0 2px ${colors.primary}20;
      ${focusRing}
    }
  }
  
  /* Error state */
  ${props => props.error && `
    .ant-input {
      border-color: ${colors.danger(props)};
      
      &:hover,
      &:focus,
      &:focus-within {
        border-color: ${colors.danger(props)};
        box-shadow: 0 0 0 2px ${colors.danger(props)}20;
      }
    }
  `}
  
  /* Success state */
  ${props => props.success && `
    .ant-input {
      border-color: ${colors.success(props)};
      
      &:hover,
      &:focus,
      &:focus-within {
        border-color: ${colors.success(props)};
        box-shadow: 0 0 0 2px ${colors.success(props)}20;
      }
    }
  `}
`;

export const TextArea = forwardRef<HTMLTextAreaElement, InputProps>(({
  error = false,
  success = false,
  status,
  ...props
}, ref) => {
  // Determine status based on error/success props
  let inputStatus: "" | "warning" | "error" | undefined = status;
  if (error) inputStatus = 'error';
  // Note: Ant Design TextArea doesn't support 'success' status, so we handle it with custom styling
  
  return (
    <StyledTextArea
      ref={ref}
      status={inputStatus}
      error={error}
      success={success}
      {...props}
    />
  );
});

TextArea.displayName = 'TextArea';

// Attach TextArea to Input for convenience
(Input as any).TextArea = TextArea;

export default Input;