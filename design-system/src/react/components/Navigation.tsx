import React, { forwardRef, ReactNode, useState, useEffect } from 'react';
import { designSystemStyled } from '../styled';

export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Navigation variant
   */
  variant?: 'navbar' | 'sidebar' | 'tabs' | 'pills' | 'breadcrumb';
  /**
   * Brand/logo element
   */
  brand?: ReactNode;
  /**
   * Navigation items
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
  /**
   * Collapsed state for mobile
   */
  collapsed?: boolean;
  /**
   * Show sidebar overlay on mobile
   */
  showOverlay?: boolean;
  /**
   * Callback when sidebar state changes
   */
  onToggle?: (collapsed: boolean) => void;
}

export interface NavItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /**
   * Whether the item is active
   */
  active?: boolean;
  /**
   * Item content
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Whether the link is active
   */
  active?: boolean;
  /**
   * Link content
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

const StyledNavigation = designSystemStyled.nav<NavigationProps>`
  /* Navigation styles are handled by CSS classes */
`;

const StyledNavList = designSystemStyled.ul`
  /* Nav list styles are handled by CSS classes */
`;

const StyledNavItem = designSystemStyled.li<NavItemProps>`
  /* Nav item styles are handled by CSS classes */
`;

const StyledNavLink = designSystemStyled.a<NavLinkProps>`
  /* Nav link styles are handled by CSS classes */
`;

/**
 * Navigation component with multiple variants (navbar, sidebar, tabs, pills, breadcrumb)
 */
export const Navigation = forwardRef<HTMLElement, NavigationProps>(({
  variant = 'navbar',
  brand,
  children,
  className = '',
  collapsed = false,
  showOverlay = false,
  onToggle,
  ...props
}, ref) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);
  
  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };
  
  const getNavigationClasses = () => {
    const classes: string[] = [];
    
    switch (variant) {
      case 'navbar':
        classes.push('navbar');
        break;
      case 'sidebar':
        classes.push('sidebar');
        if (!isCollapsed) classes.push('show');
        break;
      case 'tabs':
        classes.push('nav-tabs');
        break;
      case 'pills':
        classes.push('nav-pills');
        break;
      case 'breadcrumb':
        classes.push('breadcrumb');
        break;
    }
    
    if (className) classes.push(className);
    
    return classes.join(' ');
  };
  
  if (variant === 'sidebar') {
    return (
      <>
        <StyledNavigation
          ref={ref}
          className={getNavigationClasses()}
          variant={variant as any}
          {...props}
        >
          {brand && (
            <div className="sidebar-header">
              <div className="sidebar-brand">{brand}</div>
            </div>
          )}
          <div className="sidebar-nav">
            {children}
          </div>
        </StyledNavigation>
        {showOverlay && (
          <div 
            className={`sidebar-overlay ${!isCollapsed ? 'show' : ''}`}
            onClick={handleToggle}
          />
        )}
      </>
    );
  }
  
  if (variant === 'navbar') {
    return (
      <StyledNavigation
        ref={ref}
        className={getNavigationClasses()}
        variant={variant as any}
        {...props}
      >
        {brand && <div className="navbar-brand">{brand}</div>}
        <button 
          className="navbar-toggler"
          onClick={handleToggle}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <StyledNavList className={`navbar-nav ${!isCollapsed ? 'show' : ''}`}>
          {children}
        </StyledNavList>
      </StyledNavigation>
    );
  }
  
  const StyledNavListAny = StyledNavList as any;
  
  return (
    <StyledNavListAny
      ref={ref as any}
      className={getNavigationClasses()}
      {...props}
    >
      {children}
    </StyledNavListAny>
  );
});

Navigation.displayName = 'Navigation';

/**
 * Navigation item component
 */
export const NavItem = forwardRef<HTMLLIElement, NavItemProps>(({
  active = false,
  children,
  className = '',
  ...props
}, ref) => {
  const itemClasses = [
    'nav-item',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <StyledNavItem
      ref={ref}
      className={itemClasses}
      active={active}
      {...props}
    >
      {children}
    </StyledNavItem>
  );
});

NavItem.displayName = 'NavItem';

/**
 * Navigation link component
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({
  active = false,
  children,
  className = '',
  ...props
}, ref) => {
  const linkClasses = [
    'nav-link',
    active && 'active',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <StyledNavLink
      ref={ref}
      className={linkClasses}
      active={active}
      {...props}
    >
      {children}
    </StyledNavLink>
  );
});

NavLink.displayName = 'NavLink';

// Breadcrumb component
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Breadcrumb items
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /**
   * Whether the item is active (current page)
   */
  active?: boolean;
  /**
   * Item content
   */
  children?: ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  const breadcrumbClasses = [
    'breadcrumb',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <nav ref={ref} aria-label="breadcrumb" {...props}>
      <ol className={breadcrumbClasses}>
        {children}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(({
  active = false,
  children,
  className = '',
  ...props
}, ref) => {
  const itemClasses = [
    'breadcrumb-item',
    active && 'active',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <li
      ref={ref}
      className={itemClasses}
      {...(active ? { 'aria-current': 'page' } : {})}
      {...props}
    >
      {children}
    </li>
  );
});

BreadcrumbItem.displayName = 'BreadcrumbItem';

// Attach sub-components to Navigation for convenience
(Navigation as any).Item = NavItem;
(Navigation as any).Link = NavLink;
(Navigation as any).Breadcrumb = Breadcrumb;
(Navigation as any).BreadcrumbItem = BreadcrumbItem;

export default Navigation;