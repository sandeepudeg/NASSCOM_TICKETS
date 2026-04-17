/**
 * TicketIQ Design System - Stylelint Configuration
 * CSS Linting and Design System Compliance Rules
 */

module.exports = {
  extends: ['stylelint-config-standard'],
  
  rules: {
    // Design token compliance
    'declaration-property-value-allowed-list': {
      'color': [
        // Allow CSS custom properties for colors
        '/^var\\(--color-/',
        // Allow transparent and inherit
        'transparent',
        'inherit',
        'currentColor',
        // Allow specific design system colors
        '/^#[0-9a-f]{6}$/i'
      ],
      'background-color': [
        '/^var\\(--color-/',
        'transparent',
        'inherit',
        '/^#[0-9a-f]{6}$/i'
      ],
      'border-color': [
        '/^var\\(--color-/',
        'transparent',
        'inherit',
        'currentColor',
        '/^#[0-9a-f]{6}$/i'
      ]
    },
    
    // Spacing compliance - only allow design system spacing values
    'declaration-property-value-allowed-list': {
      'margin': [
        '/^var\\(--spacing-/',
        '0',
        'auto',
        'inherit'
      ],
      'padding': [
        '/^var\\(--spacing-/',
        '0',
        'inherit'
      ],
      'gap': [
        '/^var\\(--spacing-/',
        '0'
      ]
    },
    
    // Typography compliance
    'font-family-name-quotes': 'always-where-recommended',
    'font-weight-notation': 'numeric',
    
    // Border radius compliance
    'declaration-property-value-allowed-list': {
      'border-radius': [
        '/^var\\(--border-radius-/',
        '0',
        '50%',
        '999px'
      ]
    },
    
    // Shadow compliance
    'declaration-property-value-allowed-list': {
      'box-shadow': [
        '/^var\\(--shadow-/',
        'none',
        'inherit'
      ]
    },
    
    // Transition compliance
    'declaration-property-value-allowed-list': {
      'transition-duration': [
        '/^var\\(--transition-duration-/',
        '0s'
      ],
      'transition-timing-function': [
        '/^var\\(--transition-easing-/',
        'linear',
        'ease',
        'ease-in',
        'ease-out',
        'ease-in-out'
      ]
    },
    
    // Prevent hardcoded values that should use design tokens
    'declaration-property-value-disallowed-list': {
      'color': [
        // Disallow hardcoded hex colors except for specific cases
        '/^#(?!4f46e5|ffffff|000000)[0-9a-f]{6}$/i'
      ],
      'font-size': [
        // Disallow hardcoded font sizes
        '/^\\d+px$/',
        '/^\\d+pt$/'
      ],
      'line-height': [
        // Disallow hardcoded line heights
        '/^\\d+px$/'
      ]
    },
    
    // Ensure proper nesting and organization
    'max-nesting-depth': 3,
    'selector-max-compound-selectors': 4,
    'selector-max-id': 0, // Discourage ID selectors
    
    // Accessibility requirements
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['focus-visible']
      }
    ],
    
    // Performance rules
    'selector-max-universal': 1,
    'declaration-no-important': true,
    
    // Design system specific rules
    'custom-property-pattern': [
      '^(color|font|spacing|border-radius|shadow|transition|breakpoint|z-index)-.+',
      {
        message: 'Custom properties should follow design system naming convention'
      }
    ],
    
    // Class naming convention
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      {
        message: 'Class names should use kebab-case'
      }
    ],
    
    // Require comments for complex selectors
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands']
      }
    ]
  },
  
  ignoreFiles: [
    'node_modules/**/*',
    'dist/**/*',
    '**/*.min.css'
  ],
  
  overrides: [
    {
      files: ['src/styles/base/**/*.css'],
      rules: {
        // Allow more flexibility in base styles
        'declaration-property-value-disallowed-list': null,
        'declaration-property-value-allowed-list': null
      }
    },
    {
      files: ['src/styles/utilities/**/*.css'],
      rules: {
        // Utility classes can have more direct values
        'declaration-property-value-allowed-list': null
      }
    }
  ]
};