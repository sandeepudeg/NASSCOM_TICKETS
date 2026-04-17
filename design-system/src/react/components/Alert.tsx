import React, { forwardRef, ReactNode } from 'react';
import { Alert as AntdAlert, AlertProps as AntdAlertProps } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, transitions } from '../styled';

export interface AlertProps extends AntdAlertProps {
  /**
   * Alert variant
   */
  variant?: 'filled' | 'outlined' | 'subtle';
  /**
   * Alert size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Custom icon
   */
  icon?: ReactNode;
  /**
   * Show border
   */
  bordered?: boolean;
}

const StyledAlert = designSystemStyled(AntdAlert)<AlertProps>`
  border-radius: ${borderRadius.lg};
  transition: all ${transitions.fast};
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          padding: ${spacing.sm(props)};
          font-size: 14px;
          
          .ant-alert-icon {
            font-size: 16px;
          }
        `;
      case 'large':
        return `
          padding: ${spacing.xl(props)};
          font-size: 16px;
          
          .ant-alert-icon {
            font-size: 20px;
          }
        `;
      default: // medium
        return `
          padding: ${spacing.lg(props)};
          font-size: 15px;
          
          .ant-alert-icon {
            font-size: 18px;
          }
        `;
    }
  }}
  
  /* Type and variant combinations */
  ${props => {
    const getAlertStyles = (type: string) => {
      const colorMap = {
        success: colors.success(props),
        info: colors.info(props),
        warning: colors.warning(props),
        error: colors.danger(props),
      };
      
      const alertColor = colorMap[type as keyof typeof colorMap] || colors.info(props);
      
      switch (props.variant) {
        case 'filled':
          return `
            background-color: ${alertColor};
            border-color: ${alertColor};
            color: white;
            
            .ant-alert-icon {
              color: white;
            }
            
            .ant-alert-close-icon {
              color: white;
              
              &:hover {
                background-color: rgba(255, 255, 255, 0.1);
              }
            }
          `;
        case 'outlined':
          return `
            background-color: ${colors.background(props)};
            border: 2px solid ${alertColor};
            color: ${colors.text(props)};
            
            .ant-alert-icon {
              color: ${alertColor};
            }
            
            .ant-alert-message {
              color: ${colors.text(props)};
            }
            
            .ant-alert-description {
              color: ${colors.textMuted(props)};
            }
          `;
        default: // subtle
          return `
            background-color: ${alertColor}15;
            border: 1px solid ${alertColor}30;
            color: ${colors.text(props)};
            
            .ant-alert-icon {
              color: ${alertColor};
            }
            
            .ant-alert-message {
              color: ${colors.text(props)};
            }
            
            .ant-alert-description {
              color: ${colors.textMuted(props)};
            }
          `;
      }
    };
    
    return getAlertStyles(props.type || 'info');
  }}
  
  /* Message and description */
  .ant-alert-message {
    font-weight: 500;
    margin-bottom: ${props => props.description ? spacing.xs(props) : '0'};
  }
  
  .ant-alert-description {
    line-height: 1.5;
  }
  
  /* Close button */
  .ant-alert-close-icon {
    border-radius: ${borderRadius.sm};
    transition: all ${transitions.fast};
    
    &:hover {
      background-color: ${colors.background2};
    }
  }
  
  /* Action button */
  .ant-alert-action {
    margin-left: ${spacing.sm};
  }
  
  /* Bordered variant */
  ${props => !props.bordered && 'border: none;'}
`;

/**
 * Enhanced Alert component that extends Ant Design Alert with design system tokens
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(({
  variant = 'subtle',
  size = 'medium',
  type = 'info',
  bordered = true,
  icon,
  showIcon = true,
  ...props
}, ref) => {
  return (
    <StyledAlert
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      bordered={bordered}
      showIcon={showIcon}
      icon={icon}
      {...props}
    />
  );
});

Alert.displayName = 'Alert';

export default Alert;