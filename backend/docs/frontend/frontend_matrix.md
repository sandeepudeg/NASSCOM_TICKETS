# Frontend Responsiveness & Browser Support

- **Supported browsers**: Chrome ≥118, Edge ≥118, Firefox ≥115, Safari ≥16.4.
- **Breakpoints to test**: 320px (mobile), 768px (tablet), 1280px (desktop).
- **Smoke checks (Playwright)**:
  - Load home page, open classification form, ensure no horizontal scroll on mobile.
  - Folder list and ticket cards wrap without overflow; buttons remain tappable.
- **Layout guidance**:
  - Use flex/grid with `gap` and minmax columns; avoid fixed widths.
  - Use container queries or `%/fr` units for cards; set `img { max-width: 100%; height: auto; }`.
  - Typo scale: base 15–16px mobile, 16–17px desktop; ensure 44px tap targets.
- **Accessibility**:
  - High-contrast theme variant; focus outlines; `aria-label` on icon buttons.
  - Reduce motion toggle; keep essential transitions ≤150ms.
