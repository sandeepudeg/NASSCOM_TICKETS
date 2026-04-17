import React, { forwardRef, ReactNode } from 'react';
import { designSystemStyled } from '../styled';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Grid gap size
   */
  gap?: 'none' | 'small' | 'medium' | 'large';
  /**
   * Remove gutters between columns
   */
  noGutters?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Child elements
   */
  children?: ReactNode;
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Column span (1-12)
   */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto';
  /**
   * Column offset
   */
  offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  /**
   * Responsive column configuration
   */
  xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | { span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto'; offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 };
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | { span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto'; offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 };
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | { span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto'; offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 };
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | { span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto'; offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 };
  xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | { span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto'; offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 };
  '2xl'?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | { span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto'; offset?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 };
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Child elements
   */
  children?: ReactNode;
}

const StyledGrid = designSystemStyled.div<GridProps>`
  /* Grid styles are handled by CSS classes */
`;

const StyledGridItem = designSystemStyled.div<GridItemProps>`
  /* Grid item styles are handled by CSS classes */
`;

/**
 * Grid component based on 12-column system with responsive breakpoints
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(({
  gap = 'medium',
  noGutters = false,
  className = '',
  children,
  ...props
}, ref) => {
  const gridClasses = [
    'row',
    noGutters && 'no-gutters',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <StyledGrid
      ref={ref}
      className={gridClasses}
      gap={gap}
      {...props}
    >
      {children}
    </StyledGrid>
  );
});

Grid.displayName = 'Grid';

/**
 * Grid item component with 12-column responsive system
 */
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(({
  span,
  offset,
  xs,
  sm,
  md,
  lg,
  xl,
  '2xl': xxl,
  className = '',
  children,
  ...props
}, ref) => {
  const generateClasses = () => {
    const classes: string[] = [];
    
    // Base column class
    if (span === 'auto') {
      classes.push('col-auto');
    } else if (span) {
      classes.push(`col-${span}`);
    } else {
      classes.push('col');
    }
    
    // Base offset
    if (offset) {
      classes.push(`offset-${offset}`);
    }
    
    // Responsive classes
    const breakpoints = { xs, sm, md, lg, xl, '2xl': xxl };
    
    Object.entries(breakpoints).forEach(([breakpoint, config]) => {
      if (config) {
        const bp = breakpoint === '2xl' ? '2xl' : breakpoint;
        
        if (typeof config === 'object') {
          if (config.span === 'auto') {
            classes.push(`col-${bp}-auto`);
          } else if (config.span) {
            classes.push(`col-${bp}-${config.span}`);
          }
          
          if (config.offset !== undefined) {
            classes.push(`offset-${bp}-${config.offset}`);
          }
        } else {
          if (config === 'auto') {
            classes.push(`col-${bp}-auto`);
          } else {
            classes.push(`col-${bp}-${config}`);
          }
        }
      }
    });
    
    return classes;
  };
  
  const itemClasses = [
    ...generateClasses(),
    className
  ].filter(Boolean).join(' ');
  
  return (
    <StyledGridItem
      ref={ref}
      className={itemClasses}
      {...props}
    >
      {children}
    </StyledGridItem>
  );
});

GridItem.displayName = 'GridItem';

// Attach GridItem to Grid for convenience
(Grid as any).Item = GridItem;

export default Grid;