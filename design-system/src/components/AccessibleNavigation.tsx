import React, { useState, useRef, useEffect } from 'react';

export interface AccessibleSkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const AccessibleSkipLink: React.FC<AccessibleSkipLinkProps> = ({ href, children }) => {
  return (
    <a 
      href={href}
      className="skip-nav"
    >
      {children}
    </a>
  );
};

export interface AccessibleNavItemProps {
  href: string;
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const AccessibleNavItem: React.FC<AccessibleNavItemProps> = ({
  href,
  children,
  current = false,
  disabled = false,
  onClick
}) => {
  return (
    <a
      href={href}
      className={`nav-link ${current ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      aria-current={current ? 'page' : undefined}
      aria-disabled={disabled}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </a>
  );
};

export interface AccessibleBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export const AccessibleBreadcrumb: React.FC<AccessibleBreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb">
        {items.map((item, index) => (
          <li 
            key={index}
            className={`breadcrumb-item ${item.current ? 'active' : ''}`}
            aria-current={item.current ? 'page' : undefined}
          >
            {item.href && !item.current ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export interface AccessibleTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  const [activeTabId, setActiveTabId] = useState(activeTab || tabs[0]?.id);
  const tabListRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (activeTab) {
      setActiveTabId(activeTab);
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string, index: number) => {
    const tabElements = tabListRef.current?.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        const prevTab = tabs[prevIndex];
        if (!prevTab.disabled) {
          tabElements[prevIndex]?.focus();
          handleTabClick(prevTab.id);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        const nextTab = tabs[nextIndex];
        if (!nextTab.disabled) {
          tabElements[nextIndex]?.focus();
          handleTabClick(nextTab.id);
        }
        break;
        
      case 'Home':
        e.preventDefault();
        const firstEnabledTab = tabs.find(tab => !tab.disabled);
        if (firstEnabledTab) {
          const firstIndex = tabs.indexOf(firstEnabledTab);
          tabElements[firstIndex]?.focus();
          handleTabClick(firstEnabledTab.id);
        }
        break;
        
      case 'End':
        e.preventDefault();
        const lastEnabledTab = [...tabs].reverse().find(tab => !tab.disabled);
        if (lastEnabledTab) {
          const lastIndex = tabs.indexOf(lastEnabledTab);
          tabElements[lastIndex]?.focus();
          handleTabClick(lastEnabledTab.id);
        }
        break;
    }
  };

  return (
    <div className="tabs">
      <div 
        ref={tabListRef}
        role="tablist" 
        className="nav nav-tabs"
        aria-label="Tab navigation"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            className={`nav-link ${activeTabId === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            aria-selected={activeTabId === tab.id}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={activeTabId === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          className={`tab-pane ${activeTabId === tab.id ? 'active show' : ''}`}
          hidden={activeTabId !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

export interface AccessibleDropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
  }>;
  align?: 'left' | 'right';
}

export const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  trigger,
  items,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const enabledItems = items.filter(item => !item.disabled && !item.divider);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(0);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < enabledItems.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev > 0 ? prev - 1 : enabledItems.length - 1
        );
        break;
        
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
        
      case 'End':
        e.preventDefault();
        setFocusedIndex(enabledItems.length - 1);
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        const focusedItem = enabledItems[focusedIndex];
        if (focusedItem) {
          if (focusedItem.onClick) {
            focusedItem.onClick();
          } else if (focusedItem.href) {
            window.location.href = focusedItem.href;
          }
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  };

  const handleItemClick = (item: typeof items[0]) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  return (
    <div ref={dropdownRef} className="dropdown position-relative">
      <button
        ref={triggerRef}
        className="btn dropdown-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className={`dropdown-menu show ${align === 'right' ? 'dropdown-menu-end' : ''}`}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <hr key={index} className="dropdown-divider" />;
            }
            
            const enabledIndex = enabledItems.indexOf(item);
            const isFocused = enabledIndex === focusedIndex;
            
            return (
              <a
                key={index}
                href={item.href || '#'}
                className={`dropdown-item ${item.disabled ? 'disabled' : ''} ${isFocused ? 'focus' : ''}`}
                role="menuitem"
                aria-disabled={item.disabled}
                tabIndex={isFocused ? 0 : -1}
                onClick={(e) => {
                  if (!item.href) e.preventDefault();
                  handleItemClick(item);
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface AccessiblePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

export const AccessiblePagination: React.FC<AccessiblePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav aria-label="Pagination navigation">
      <ul className="pagination">
        {showFirstLast && currentPage > 1 && (
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => onPageChange(1)}
              aria-label="Go to first page"
            >
              First
            </button>
          </li>
        )}
        
        {showPrevNext && currentPage > 1 && (
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Go to previous page"
            >
              Previous
            </button>
          </li>
        )}
        
        {visiblePages.map((page) => (
          <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(page)}
              aria-label={page === currentPage ? `Current page, page ${page}` : `Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}
        
        {showPrevNext && currentPage < totalPages && (
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Go to next page"
            >
              Next
            </button>
          </li>
        )}
        
        {showFirstLast && currentPage < totalPages && (
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => onPageChange(totalPages)}
              aria-label="Go to last page"
            >
              Last
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};