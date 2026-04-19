import { designSystemStyled, DesignSystemTheme } from '../styled';
import { StyledComponent } from '@emotion/styled';

/**
 * Utility to create styled components with design system theme
 */
export function createStyledComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T
): StyledComponent<
  {
    theme?: DesignSystemTheme;
    as?: React.ElementType;
  } & JSX.IntrinsicElements[T],
  DesignSystemTheme
>;

export function createStyledComponent<P extends object>(
  component: React.ComponentType<P>
): StyledComponent<
  P & {
    theme?: DesignSystemTheme;
    as?: React.ElementType;
  },
  DesignSystemTheme
>;

export function createStyledComponent(tagOrComponent: any): any {
  return designSystemStyled(tagOrComponent);
}

export default createStyledComponent;