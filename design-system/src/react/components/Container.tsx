import React, { forwardRef, ReactNode } from 'react';
import { designSystemStyled } from '../styled';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Container type
   */
  fluid?: boolean;
  /**
   * Center the container content
   */
  centered?: boolean;
  /**
   * Children content
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

const StyledContainer = designSystemStyled.div<ContainerProps>`
  /* Container styles are handled by CSS classes */
  ${props => props.centered && `
    display: flex;
    flex-direction: column;
    align-items: center;
  `}
`;

/**
 * Container component with responsive width constraints and consistent padding
 * Uses the design system's responsive container system (320px to 2560px)
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(({
  fluid = false,
  centered = false,
  children,
  className = '',
  ...props
}, ref) => {
  const containerClasses = [
    fluid ? 'container-fluid' : 'container',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <StyledContainer
      ref={ref}
      className={containerClasses}
      centered={centered}
      fluid={fluid}
      {...props}
    >
      {children}
    </StyledContainer>
  );
});

Container.displayName = 'Container';

export default Container;