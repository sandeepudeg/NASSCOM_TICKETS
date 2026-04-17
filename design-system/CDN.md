# CDN Usage Guide

The TicketIQ Design System provides CDN-ready assets for quick integration without npm installation.

## CSS Assets

### Design Tokens (CSS Custom Properties)

```html
<!-- All design tokens -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens.css">

<!-- Dark theme tokens only -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens-dark.css">

<!-- Light theme tokens only -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens-light.css">
```

### Complete Styles

```html
<!-- Minified complete styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/styles.min.css">

<!-- Development version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/styles.css">
```

## JavaScript Assets

### Design Tokens (UMD Bundle)

```html
<script src="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens.umd.js"></script>
<script>
  // Access tokens via global variable
  console.log(TicketIQDesignSystem.tokens.colors.primary);
</script>
```

### ES Modules

```html
<script type="module">
  import { tokens } from 'https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-system.esm.js';
  console.log(tokens.colors.primary);
</script>
```

### CommonJS (Node.js style)

```html
<script src="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-system.js"></script>
```

## Version Pinning

For production use, always pin to a specific version:

```html
<!-- Pin to specific version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@1.0.0/dist/styles.min.css">
<script src="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@1.0.0/dist/cdn/ticketiq-design-tokens.umd.js"></script>
```

## Alternative CDNs

### unpkg

```html
<link rel="stylesheet" href="https://unpkg.com/@ticketiq/design-system@latest/dist/styles.min.css">
<script src="https://unpkg.com/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens.umd.js"></script>
```

### cdnjs (after publication)

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ticketiq-design-system/1.0.0/styles.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/ticketiq-design-system/1.0.0/ticketiq-design-tokens.umd.min.js"></script>
```

## Usage Examples

### Basic HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TicketIQ Design System Demo</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/styles.min.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to TicketIQ</h1>
    <button class="btn btn-primary">Get Started</button>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens.umd.js"></script>
  <script>
    // Access design tokens programmatically
    document.documentElement.style.setProperty('--custom-primary', TicketIQDesignSystem.tokens.colors.primary);
  </script>
</body>
</html>
```

### Theme Switching

```html
<script>
  function switchTheme(theme) {
    const themeLink = document.getElementById('theme-css');
    if (theme === 'dark') {
      themeLink.href = 'https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens-dark.css';
    } else {
      themeLink.href = 'https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens-light.css';
    }
  }
</script>
```

## File Sizes

| Asset | Minified | Gzipped |
|-------|----------|---------|
| styles.min.css | ~15KB | ~4KB |
| ticketiq-design-tokens.css | ~8KB | ~2KB |
| ticketiq-design-tokens.umd.js | ~12KB | ~3KB |

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 60+

## Security

All CDN assets are served with:
- HTTPS only
- Proper CORS headers
- Subresource Integrity (SRI) hashes available
- Content Security Policy compatible

## Performance Tips

1. **Use minified versions** in production
2. **Pin specific versions** to avoid cache invalidation
3. **Preload critical assets** with `<link rel="preload">`
4. **Use HTTP/2 server push** when possible
5. **Consider bundling** for better compression with your own assets