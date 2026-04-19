import React, { forwardRef } from 'react';
import { Input as AntdInput, InputProps as AntdInputProps, InputRef } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, transitions, focusRing } from '../styled';

export interface InputProps extends Omit<any, 'size'> {
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
    background-color: ${(props: any) => 
      props.variant === 'filled' ? colors.surface(props) : 
      props.variant === 'borderless' ? 'transparent' : colors.background(props)
    };
    border-color: ${(props: any) => colors.border(props)};
    color: ${(props: any) => colors.text(props)};
    
    ${(props: any) => props.variant === 'borderless' && 'border: none;'}
    
    &::placeholder {
      color: ${(props: any) => colors.textMuted(props)};
    }
    
    &:hover {
      border-color: ${(props: any) => colors.primary(props)};
    }
    
    &:focus,
    &:focus-within {
      border-color: ${(props: any) => colors.primary(props)};
      box-shadow: 0 0 0 2px ${(props: any) => colors.primary(props)}20;
      ${focusRing}
    }
  }
  
  /* Error state */
  ${(props: any) => props.error && `
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
  ${(props: any) => props.success && `
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
    background-color: ${(props: any) => colors.background2(props)};
    color: ${(props: any) => colors.textMuted(props)};
    cursor: not-allowed;
  }
`;

/**
 * Enhanced Input component that extends Ant Design Input with design system tokens
 */
export const Input = forwardRef<InputRef, InputProps>(({
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
  
  const StyledInputAny = StyledInput as any;
  
  return (
    <StyledInputAny
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
    background-color: ${(props: any) => colors.background(props)};
    border-color: ${(props: any) => colors.border(props)};
    color: ${(props: any) => colors.text(props)};
    border-radius: ${(props: any) => borderRadius.base(props)};
    transition: all ${transitions.fast};
    
    &::placeholder {
      color: ${(props: any) => colors.textMuted(props)};
    }
    
    &:hover {
      border-color: ${(props: any) => colors.primary(props)};
    }
    
    &:focus,
    &:focus-within {
      border-color: ${(props: any) => colors.primary(props)};
      box-shadow: 0 0 0 2px ${(props: any) => colors.primary(props)}20;
      ${focusRing}
    }
  }
  
  /* Error state */
  ${(props: any) => props.error && `
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
  ${(props: any) => props.success && `
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
  size = 'medium',
  variant = 'default',
  error = false,
  success = false,
  status,
  ...props
}, ref) => {
  // Determine status based on error/success props
  let inputStatus: "" | "warning" | "error" | undefined = status;
  if (error) inputStatus = 'error';

  const StyledTextAreaAny = StyledTextArea as any;

  return (
    <StyledTextAreaAny
      ref={ref}
      size={(size === 'medium' ? 'middle' : size)}
      variant={variant}
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