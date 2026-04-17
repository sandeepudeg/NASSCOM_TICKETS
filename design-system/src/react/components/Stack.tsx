import React, { forwardRef, ReactNode } from 'react';
import { Space as AntdSpace, SpaceProps as AntdSpaceProps } from 'antd';
import { designSystemStyled, spacing } from '../styled';

export interface StackProps extends Omit<AntdSpaceProps, 'size' | 'direction' | 'align'> {
  /**
   * Stack direction
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * Stack spacing
   */
  spacing?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  /**
   * Responsive spacing
   */
  responsiveSpacing?: {
    xs?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
    sm?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
    md?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
    lg?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
    xl?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  };
  /**
   * Align items
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  /**
   * Wrap items
   */
  wrap?: boolean;
  /**
   * Full width
   */
  fullWidth?: boolean;
  /**
   * Children content
   */
  children?: ReactNode;
}

const StyledStack = designSystemStyled(AntdSpace)<StackProps>`
  ${props => props.fullWidth && 'width: 100%;'}
  
  /* Custom alignment and justification */
  ${props => {
    if (props.align || props.justify) {
      const alignItems = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        stretch: 'stretch',
        baseline: 'baseline',
      }[props.align || 'start'];
      
      const justifyContent = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        'space-between': 'space-between',
        'space-around': 'space-around',
        'space-evenly': 'space-evenly',
      }[props.justify || 'start'];
      
      return `
        display: flex;
        align-items: ${alignItems};
        justify-content: ${justifyContent};
        flex-direction: ${props.direction === 'vertical' ? 'column' : 'row'};
        ${props.wrap ? 'flex-wrap: wrap;' : ''}
      `;
    }
    
    return '';
  }}
`;

/**
 * Stack component for consistent spacing between elements
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(({
  direction = 'vertical',
  spacing: stackSpacing = 'medium',
  responsiveSpacing,
  align,
  justify,
  wrap = false,
  fullWidth = false,
  children,
  ...props
}, ref) => {
  // Convert spacing to Ant Design size format
  const getSpacingValue = (spacingSize: string) => {
    switch (spacingSize) {
      case 'none': return 0;
      case 'small': return 8;
      case 'large': return 24;
      case 'xlarge': return 32;
      default: return 16; // medium
    }
  };
  
  let spaceSize: number | [number, number] | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number } = getSpacingValue(stackSpacing);
  
  if (responsiveSpacing) {
    spaceSize = {
      xs: responsiveSpacing.xs ? getSpacingValue(responsiveSpacing.xs) : getSpacingValue(stackSpacing),
      sm: responsiveSpacing.sm ? getSpacingValue(responsiveSpacing.sm) : getSpacingValue(stackSpacing),
      md: responsiveSpacing.md ? getSpacingValue(responsiveSpacing.md) : getSpacingValue(stackSpacing),
      lg: responsiveSpacing.lg ? getSpacingValue(responsiveSpacing.lg) : getSpacingValue(stackSpacing),
      xl: responsiveSpacing.xl ? getSpacingValue(responsiveSpacing.xl) : getSpacingValue(stackSpacing),
    };
  }
  
  return (
    <StyledStack
      ref={ref}
      direction={direction === 'horizontal' ? 'horizontal' : 'vertical'}
      size={spaceSize}
      align={align}
      justify={justify}
      wrap={wrap}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledStack>
  );
});

Stack.displayName = 'Stack';

export default Stack;