import React from 'react';
import { notification, message } from 'antd';
import type { NotificationArgsProps, MessageArgsProps } from 'antd';

export interface ToastOptions extends Omit<NotificationArgsProps, 'type'> {
  /**
   * Toast type
   */
  type?: 'success' | 'info' | 'warning' | 'error';
  /**
   * Toast position
   */
  position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'bottom';
  /**
   * Auto close duration (seconds)
   */
  duration?: number;
  /**
   * Show close button
   */
  closable?: boolean;
}

export interface MessageOptions extends Omit<MessageArgsProps, 'type'> {
  /**
   * Message type
   */
  type?: 'success' | 'info' | 'warning' | 'error' | 'loading';
  /**
   * Auto close duration (seconds)
   */
  duration?: number;
}

// Configure notification styles
notification.config({
  placement: 'topRight',
  duration: 4.5,
  rtl: false,
});

// Configure message styles
message.config({
  duration: 3,
  maxCount: 3,
});

/**
 * Toast notification utility
 */
export const toast = {
  /**
   * Show success toast
   */
  success: (options: string | ToastOptions) => {
    const config = typeof options === 'string' 
      ? { message: options, type: 'success' as const }
      : { ...options, type: 'success' as const };
    
    return notification.success({
      placement: config.position || 'topRight',
      duration: config.duration || 4.5,
      closable: config.closable !== false,
      ...config,
    });
  },

  /**
   * Show info toast
   */
  info: (options: string | ToastOptions) => {
    const config = typeof options === 'string' 
      ? { message: options, type: 'info' as const }
      : { ...options, type: 'info' as const };
    
    return notification.info({
      placement: config.position || 'topRight',
      duration: config.duration || 4.5,
      closable: config.closable !== false,
      ...config,
    });
  },

  /**
   * Show warning toast
   */
  warning: (options: string | ToastOptions) => {
    const config = typeof options === 'string' 
      ? { message: options, type: 'warning' as const }
      : { ...options, type: 'warning' as const };
    
    return notification.warning({
      placement: config.position || 'topRight',
      duration: config.duration || 4.5,
      closable: config.closable !== false,
      ...config,
    });
  },

  /**
   * Show error toast
   */
  error: (options: string | ToastOptions) => {
    const config = typeof options === 'string' 
      ? { message: options, type: 'error' as const }
      : { ...options, type: 'error' as const };
    
    return notification.error({
      placement: config.position || 'topRight',
      duration: config.duration || 6,
      closable: config.closable !== false,
      ...config,
    });
  },

  /**
   * Destroy all toasts
   */
  destroy: () => {
    notification.destroy();
  },

  /**
   * Configure toast defaults
   */
  config: (config: {
    placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'bottom';
    duration?: number;
    rtl?: boolean;
  }) => {
    notification.config(config);
  },
};

/**
 * Simple message utility (appears at top of screen)
 */
export const msg = {
  /**
   * Show success message
   */
  success: (content: string, options?: MessageOptions) => {
    return message.success({
      content,
      duration: options?.duration || 3,
      ...options,
    });
  },

  /**
   * Show info message
   */
  info: (content: string, options?: MessageOptions) => {
    return message.info({
      content,
      duration: options?.duration || 3,
      ...options,
    });
  },

  /**
   * Show warning message
   */
  warning: (content: string, options?: MessageOptions) => {
    return message.warning({
      content,
      duration: options?.duration || 3,
      ...options,
    });
  },

  /**
   * Show error message
   */
  error: (content: string, options?: MessageOptions) => {
    return message.error({
      content,
      duration: options?.duration || 3,
      ...options,
    });
  },

  /**
   * Show loading message
   */
  loading: (content: string, options?: MessageOptions) => {
    return message.loading({
      content,
      duration: options?.duration || 0, // 0 means manual close
      ...options,
    });
  },

  /**
   * Destroy all messages
   */
  destroy: () => {
    message.destroy();
  },

  /**
   * Configure message defaults
   */
  config: (config: {
    duration?: number;
    maxCount?: number;
    rtl?: boolean;
  }) => {
    message.config(config);
  },
};

// Export both toast and msg as default
export default { toast, msg };