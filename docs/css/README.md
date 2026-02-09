# CSS Directory

This directory contains all stylesheets for the Graphite Creative Studio template integration.

## File Loading Order

Load CSS files in this specific order in your HTML:

```html
<!-- 1. Theme variables (must be first) -->
<link rel="stylesheet" href="css/graphite-theme.css">

<!-- 2. Core styles -->
<link rel="stylesheet" href="css/graphite.css">

<!-- 3. Responsive styles -->
<link rel="stylesheet" href="css/responsive.css">

<!-- 4. Custom styles (last, for overrides) -->
<link rel="stylesheet" href="css/custom.css">
```

## File Descriptions

### graphite-theme.css
**Purpose**: Design system variables and tokens

Contains CSS custom properties for:
- Color palette (light theme)
- Typography scale
- Spacing system
- Border radius
- Shadows
- Transitions
- Z-index layers
- Breakpoints

**Usage**: Reference variables throughout other CSS files
```css
.my-element {
  color: var(--primary-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
}
```

### graphite.css
**Purpose**: Core component styles

Includes:
- Base reset and typography
- Layout components (container, section, grid)
- Card components
- Form components
- Button styles
- Flexbox utilities
- Common utility classes

**Usage**: Apply classes to HTML elements
```html
<div class="card">
  <div class="card-body">
    <button class="btn btn-primary">Click me</button>
  </div>
</div>
```

### responsive.css
**Purpose**: Responsive design and media queries

Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px
- Wide: >= 1200px

Also includes:
- Touch target optimization
- Landscape orientation styles
- Print styles
- Reduced motion support
- High contrast mode support

### custom.css
**Purpose**: Project-specific styles and extensions

Contains:
- Navigation bar styles
- File upload drop zone
- Status indicators
- Log viewer
- Table styles
- Animation keyframes
- Focus styles
- Accessibility enhancements

## Customization

To customize the theme:

1. **Change colors**: Edit variables in `graphite-theme.css`
2. **Modify spacing**: Update spacing variables in `graphite-theme.css`
3. **Add components**: Add new styles to `custom.css`
4. **Adjust breakpoints**: Modify media queries in `responsive.css`

## Best Practices

1. **Use CSS variables**: Always reference theme variables instead of hardcoding values
2. **Mobile-first**: Write base styles for mobile, then add media queries for larger screens
3. **Semantic classes**: Use descriptive class names that indicate purpose
4. **Avoid !important**: Use specificity and cascade properly
5. **Performance**: Minimize selector complexity, use efficient selectors

## Browser Compatibility

All CSS uses modern standards supported by:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

For older browsers, consider adding:
- CSS custom properties polyfill
- Grid/Flexbox fallbacks
- Autoprefixer for vendor prefixes
