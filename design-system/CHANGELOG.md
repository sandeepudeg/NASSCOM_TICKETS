# Changelog

All notable changes to the TicketIQ Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced build system with CDN distribution support
- Version management and automated changelog generation
- Minified CSS output for production use
- UMD bundle for CDN consumption
- Build information tracking and summary reporting

### Changed
- Improved Style Dictionary configuration with CDN-specific formats
- Enhanced PostCSS pipeline with minification support
- Updated package.json with comprehensive build scripts

### Fixed
- Build directory creation and cleanup processes

## [1.0.0] - 2024-01-01

### Added
- Initial design token system extracted from demo page
- Style Dictionary configuration for multi-format token generation
- CSS custom properties for all design tokens
- TypeScript definitions for design tokens
- JSON export format for design tokens
- Dark and light theme variants
- Basic build pipeline with PostCSS and Autoprefixer
- NPM package structure and configuration

### Features
- Color palette standardization based on demo page design
- Typography system with consistent scales and fallbacks
- Spacing system using 4px base unit
- Border radius and shadow definitions
- Multi-format token export (CSS, JS, TS, JSON)
- Theme switching capability
- Cross-platform compatibility preparation