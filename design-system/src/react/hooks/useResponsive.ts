import { useState, useEffect } from 'react';
import { breakpoints } from '../styled';

export interface ResponsiveState {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
  current: keyof typeof breakpoints;
}

/**
 * Hook to track responsive breakpoints
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        xs: false,
        sm: false,
        md: false,
        lg: false,
        xl: false,
        xxl: false,
        current: 'md'
      };
    }

    const width = window.innerWidth;
    return {
      xs: width >= parseInt(breakpoints.xs),
      sm: width >= parseInt(breakpoints.sm),
      md: width >= parseInt(breakpoints.md),
      lg: width >= parseInt(breakpoints.lg),
      xl: width >= parseInt(breakpoints.xl),
      xxl: width >= parseInt(breakpoints.xxl),
      current: getCurrentBreakpoint(width)
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      setState({
        xs: width >= parseInt(breakpoints.xs),
        sm: width >= parseInt(breakpoints.sm),
        md: width >= parseInt(breakpoints.md),
        lg: width >= parseInt(breakpoints.lg),
        xl: width >= parseInt(breakpoints.xl),
        xxl: width >= parseInt(breakpoints.xxl),
        current: getCurrentBreakpoint(width)
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

function getCurrentBreakpoint(width: number): keyof typeof breakpoints {
  if (width >= parseInt(breakpoints.xxl)) return 'xxl';
  if (width >= parseInt(breakpoints.xl)) return 'xl';
  if (width >= parseInt(breakpoints.lg)) return 'lg';
  if (width >= parseInt(breakpoints.md)) return 'md';
  if (width >= parseInt(breakpoints.sm)) return 'sm';
  return 'xs';
}

export default useResponsive;