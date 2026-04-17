// Theme Toggle Component for TicketIQ Design System

import { 
  ThemeMode, 
  getCurrentTheme, 
  getCurrentThemeMode, 
  toggleTheme, 
  setAutoTheme, 
  isAutoTheme,
  addThemeChangeListener,
  type ThemeChangeEvent 
} from '../theme';

export interface ThemeToggleOptions {
  container: HTMLElement;
  showAutoOption?: boolean;
  showLabels?: boolean;
  className?: string;
}

export class ThemeToggle {
  private container: HTMLElement;
  private options: Required<ThemeToggleOptions>;
  private cleanupListener: (() => void) | null = null;

  constructor(options: ThemeToggleOptions) {
    this.container = options.container;
    this.options = {
      showAutoOption: true,
      showLabels: true,
      className: 'theme-toggle-component',
      ...options
    };

    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    const currentMode = getCurrentThemeMode();
    const currentTheme = getCurrentTheme();

    this.container.innerHTML = `
      <div class="${this.options.className}">
        <div class="theme-toggle-group" role="radiogroup" aria-label="Theme selection">
          <button 
            type="button" 
            class="theme-toggle-button ${currentMode === 'light' ? 'active' : ''}" 
            data-theme="light"
            role="radio"
            aria-checked="${currentMode === 'light'}"
            aria-label="Light theme"
          >
            <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
            </svg>
            ${this.options.showLabels ? '<span>Light</span>' : ''}
          </button>
          
          <button 
            type="button" 
            class="theme-toggle-button ${currentMode === 'dark' ? 'active' : ''}" 
            data-theme="dark"
            role="radio"
            aria-checked="${currentMode === 'dark'}"
            aria-label="Dark theme"
          >
            <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
            </svg>
            ${this.options.showLabels ? '<span>Dark</span>' : ''}
          </button>
          
          ${this.options.showAutoOption ? `
            <button 
              type="button" 
              class="theme-toggle-button ${currentMode === 'auto' ? 'active' : ''}" 
              data-theme="auto"
              role="radio"
              aria-checked="${currentMode === 'auto'}"
              aria-label="Auto theme (follow system)"
            >
              <svg class="theme-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 19.5c-4.125 0-7.5-3.375-7.5-7.5s3.375-7.5 7.5-7.5 7.5 3.375 7.5 7.5-3.375 7.5-7.5 7.5z"/>
                <path d="M12 4.5v15c4.125 0 7.5-3.375 7.5-7.5s-3.375-7.5-7.5-7.5z"/>
              </svg>
              ${this.options.showLabels ? '<span>Auto</span>' : ''}
              ${currentMode === 'auto' ? `<span class="theme-auto-indicator">(${currentTheme})</span>` : ''}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Listen for button clicks
    this.container.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest('.theme-toggle-button') as HTMLButtonElement;
      if (!button) return;

      const theme = button.dataset.theme as ThemeMode;
      if (!theme) return;

      if (theme === 'auto') {
        setAutoTheme();
      } else {
        // Use the theme utilities to apply the theme
        const { applyTheme } = require('../theme');
        applyTheme(theme, 'user');
      }

      this.updateActiveState();
    });

    // Listen for theme changes from other sources
    this.cleanupListener = addThemeChangeListener((event: ThemeChangeEvent) => {
      this.updateActiveState();
    });

    // Handle keyboard navigation
    this.container.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLButtonElement && event.target.classList.contains('theme-toggle-button')) {
        const buttons = Array.from(this.container.querySelectorAll('.theme-toggle-button')) as HTMLButtonElement[];
        const currentIndex = buttons.indexOf(event.target);

        let nextIndex = currentIndex;
        
        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
            event.preventDefault();
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
            event.preventDefault();
            break;
          case 'Home':
            nextIndex = 0;
            event.preventDefault();
            break;
          case 'End':
            nextIndex = buttons.length - 1;
            event.preventDefault();
            break;
        }

        if (nextIndex !== currentIndex) {
          buttons[nextIndex].focus();
        }
      }
    });
  }

  private updateActiveState(): void {
    const currentMode = getCurrentThemeMode();
    const currentTheme = getCurrentTheme();
    
    // Update button states
    const buttons = this.container.querySelectorAll('.theme-toggle-button');
    buttons.forEach((button) => {
      const buttonTheme = (button as HTMLElement).dataset.theme;
      const isActive = buttonTheme === currentMode;
      
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-checked', isActive.toString());
    });

    // Update auto indicator
    const autoButton = this.container.querySelector('[data-theme="auto"]');
    if (autoButton && currentMode === 'auto') {
      const indicator = autoButton.querySelector('.theme-auto-indicator');
      if (indicator) {
        indicator.textContent = `(${currentTheme})`;
      }
    }
  }

  public destroy(): void {
    if (this.cleanupListener) {
      this.cleanupListener();
      this.cleanupListener = null;
    }
    this.container.innerHTML = '';
  }
}

// CSS styles for the theme toggle component
export const themeToggleStyles = `
.theme-toggle-component {
  display: inline-block;
}

.theme-toggle-group {
  display: flex;
  background: var(--color-theme-surface);
  border: 1px solid var(--color-theme-border);
  border-radius: var(--borderRadius-md);
  padding: 2px;
  gap: 2px;
}

.theme-toggle-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: transparent;
  border: none;
  border-radius: calc(var(--borderRadius-md) - 2px);
  color: var(--color-theme-text-muted);
  cursor: pointer;
  transition: all var(--theme-transition-duration) var(--theme-transition-easing);
  font-size: var(--typography-body-small-fontSize);
  font-family: inherit;
}

.theme-toggle-button:hover {
  background: var(--color-theme-background-secondary);
  color: var(--color-theme-text);
}

.theme-toggle-button:focus-visible {
  outline: 2px solid var(--color-theme-primary);
  outline-offset: 2px;
}

.theme-toggle-button.active {
  background: var(--color-theme-primary);
  color: var(--color-primitive-white);
}

.theme-toggle-button .theme-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.theme-auto-indicator {
  font-size: 0.6875rem;
  opacity: 0.8;
  margin-left: var(--spacing-1);
}
`;