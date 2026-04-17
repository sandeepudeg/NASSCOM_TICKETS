import React, { forwardRef, ReactNode } from 'react';
import { Modal as AntdModal, ModalProps as AntdModalProps } from 'antd';
import { designSystemStyled, colors, spacing, borderRadius, shadows, transitions } from '../styled';

export interface ModalProps extends Omit<AntdModalProps, 'size'> {
  /**
   * Modal size
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  /**
   * Modal variant
   */
  variant?: 'default' | 'centered' | 'drawer';
  /**
   * Custom header content
   */
  header?: ReactNode;
  /**
   * Custom footer content
   */
  footer?: ReactNode;
  /**
   * Remove default padding
   */
  noPadding?: boolean;
}

const StyledModal = designSystemStyled(AntdModal)<ModalProps>`
  /* Modal mask */
  .ant-modal-mask {
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }
  
  /* Modal wrapper */
  .ant-modal-wrap {
    ${props => props.variant === 'centered' && `
      display: flex;
      align-items: center;
      justify-content: center;
    `}
  }
  
  /* Modal content */
  .ant-modal-content {
    background-color: ${colors.background};
    border: 1px solid ${colors.border};
    border-radius: ${borderRadius.lg};
    box-shadow: ${shadows.large};
    overflow: hidden;
    
    ${props => {
      switch (props.size) {
        case 'small':
          return `
            width: 400px !important;
            max-width: 90vw;
          `;
        case 'large':
          return `
            width: 800px !important;
            max-width: 90vw;
          `;
        case 'fullscreen':
          return `
            width: 100vw !important;
            height: 100vh !important;
            max-width: none;
            margin: 0;
            border-radius: 0;
            
            .ant-modal-body {
              height: calc(100vh - 110px);
              overflow-y: auto;
            }
          `;
        default: // medium
          return `
            width: 600px !important;
            max-width: 90vw;
          `;
      }
    }}
  }
  
  /* Modal header */
  .ant-modal-header {
    background-color: ${colors.surface};
    border-bottom: 1px solid ${colors.border};
    padding: ${spacing.lg};
    
    .ant-modal-title {
      color: ${colors.text};
      font-weight: 600;
      font-size: 18px;
    }
  }
  
  /* Modal body */
  .ant-modal-body {
    background-color: ${colors.background};
    color: ${colors.text};
    padding: ${props => props.noPadding ? '0' : spacing.lg(props)};
    max-height: 70vh;
    overflow-y: auto;
  }
  
  /* Modal footer */
  .ant-modal-footer {
    background-color: ${colors.surface};
    border-top: 1px solid ${colors.border};
    padding: ${spacing.lg};
    text-align: right;
    
    .ant-btn + .ant-btn {
      margin-left: ${spacing.sm};
    }
  }
  
  /* Close button */
  .ant-modal-close {
    color: ${colors.textMuted};
    transition: color ${transitions.fast};
    
    &:hover {
      color: ${colors.text};
    }
  }
  
  /* Drawer variant */
  ${props => props.variant === 'drawer' && `
    .ant-modal-content {
      position: fixed;
      right: 0;
      top: 0;
      height: 100vh;
      width: 400px;
      max-width: 80vw;
      margin: 0;
      border-radius: 0;
      border-left: 1px solid ${colors.border(props)};
      border-right: none;
      border-top: none;
      border-bottom: none;
      
      .ant-modal-body {
        height: calc(100vh - 110px);
        max-height: none;
      }
    }
  `}
`;

/**
 * Enhanced Modal component that extends Ant Design Modal with design system tokens
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(({
  size = 'medium',
  variant = 'default',
  header,
  footer,
  noPadding = false,
  title,
  children,
  ...props
}, ref) => {
  // Use custom header if provided
  const modalTitle = header || title;
  
  return (
    <StyledModal
      title={modalTitle}
      size={size}
      variant={variant}
      noPadding={noPadding}
      centered={variant === 'centered'}
      {...props}
    >
      {children}
    </StyledModal>
  );
});

Modal.displayName = 'Modal';

export default Modal;