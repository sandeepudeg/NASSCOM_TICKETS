import React, { forwardRef, ReactNode, CSSProperties } from 'react';
import { Flex as AntdFlex, FlexProps as AntdFlexProps } from 'antd';
import { designSystemStyled, spacing } from '../styled';

export interface FlexProps extends AntdFlexProps {
  /**
   * Flex direction
   */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /**
   * Align items
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  /**
   * Flex wrap
   */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /**
   * Gap between items
   */
  gap?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | number;
  /**
   * Responsive gap
   */
  responsiveGap?: {
    xs?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | number;
    sm?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | number;
    md?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | number;
    lg?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | number;
    xl?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | number;
  };
  /**
   * Full width
   */
  fullWidth?: boolean;
  /**
   * Full height
   */
  fullHeight?: boolean;
  /**
   * Children content
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
  /**
   * Additional styles
   */
  style?: CSSProperties;
}

const StyledFlex = designSystemStyled(AntdFlex)<FlexProps>`
  ${props => props.fullWidth && 'width: 100%;'}
  ${props => props.fullHeight && 'height: 100%;'}
  
  /* Custom gap handling for responsive gaps */
  ${props => {
    if (props.responsiveGap) {
      const getGapValue = (gapSize: string | number) => {
        if (typeof gapSize === 'number') return `${gapSize}px`;
        
        switch (gapSize) {
          case 'none': return '0';
          case 'small': return spacing.sm(props);
          case 'large': return spacing.xl(props);
          case 'xlarge': return spacing.xxl(props);
          default: return spacing.lg(props); // medium
        }
      };
      
      return `
        @media (max-width: 575px) {
          gap: ${props.responsiveGap.xs ? getGapValue(props.responsiveGap.xs) : getGapValue(props.gap || 'medium')};
        }
        
        @media (min-width: 576px) {
          gap: ${props.responsiveGap.sm ? getGapValue(props.responsiveGap.sm) : getGapValue(props.gap || 'medium')};
        }
        
        @media (min-width: 768px) {
          gap: ${props.responsiveGap.md ? getGapValue(props.responsiveGap.md) : getGapValue(props.gap || 'medium')};
        }
        
        @media (min-width: 992px) {
          gap: ${props.responsiveGap.lg ? getGapValue(props.responsiveGap.lg) : getGapValue(props.gap || 'medium')};
        }
        
        @media (min-width: 1200px) {
          gap: ${props.responsiveGap.xl ? getGapValue(props.responsiveGap.xl) : getGapValue(props.gap || 'medium')};
        }
      `;
    }
    
    return '';
  }}
`;

/**
 * Flex component for flexible layouts with design system tokens
 */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(({
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = 'nowrap',
  gap = 'medium',
  responsiveGap,
  fullWidth = false,
  fullHeight = false,
  children,
  className,
  style,
  ...props
}, ref) => {
  // Convert gap to Ant Design format
  const getGapValue = (gapSize: string | number) => {
    if (typeof gapSize === 'number') return gapSize;
    
    switch (gapSize) {
      case 'none': return 0;
      case 'small': return 8;
      case 'large': return 24;
      case 'xlarge': return 32;
      default: return 16; // medium
    }
  };
  
  let flexGap: number | string = getGapValue(gap);
  
  // Handle responsive gap
  if (responsiveGap) {
    // For responsive gaps, we'll use CSS custom properties in StyledFlex
    flexGap = getGapValue(gap);
  }
  
  // Map align and justify to Ant Design format
  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  }[align];
  
  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  }[justify];
  
  return (
    <StyledFlex
      ref={ref}
      vertical={direction === 'column' || direction === 'column-reverse'}
      align={alignItems}
      justify={justifyContent}
      wrap={wrap}
      gap={flexGap}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      responsiveGap={responsiveGap}
      className={className}
      style={{
        flexDirection: direction,
        ...style,
      }}
      {...props}
    >
      {children}
    </StyledFlex>
  );
});

Flex.displayName = 'Flex';

export default Flex;