/**
 * Test Utility Functions
 * 
 * Helper functions for testing the Graphite template integration.
 * These utilities support property-based testing and accessibility validation.
 */

/**
 * Calculate the contrast ratio between two colors
 * @param {string} color1 - First color (CSS color string)
 * @param {string} color2 - Second color (CSS color string)
 * @returns {number} Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get the relative luminance of a color
 * @param {string} color - CSS color string
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance(color) {
  const rgb = parseColor(color);
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse a CSS color string to RGB values
 * @param {string} color - CSS color string
 * @returns {number[]} Array of [r, g, b] values (0-255)
 */
function parseColor(color) {
  // Handle transparent or invalid colors
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return [255, 255, 255]; // Default to white
  }

  // Create a temporary element to compute the color
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const imageData = ctx.getImageData(0, 0, 1, 1).data;
  return Array.from(imageData.slice(0, 3));
}

/**
 * Check if a color value comes from the theme configuration
 * @param {string} color - CSS color string
 * @returns {boolean} True if the color is a theme color
 */
export function isThemeColor(color) {
  // Graphite light theme colors
  const themeColors = [
    // Primary colors
    '#0066cc', '#00d4ff',
    // Secondary colors
    '#ff6b6b', '#ffa500',
    // Background colors (light theme)
    '#ffffff', '#f8f9fa', '#e9ecef',
    // Text colors
    '#212529', '#495057', '#6c757d',
    // Border colors
    '#dee2e6',
    // Status colors
    '#28a745', '#ffc107', '#dc3545', '#17a2b8'
  ];

  // Normalize the color for comparison
  const normalizedColor = color.toLowerCase().trim();
  
  // Check if it's a CSS variable reference
  if (normalizedColor.includes('var(')) {
    return true;
  }

  // Check if it matches any theme color
  return themeColors.some(themeColor => {
    const normalizedTheme = themeColor.toLowerCase();
    return normalizedColor.includes(normalizedTheme) || 
           rgbToHex(normalizedColor) === normalizedTheme;
  });
}

/**
 * Convert RGB color string to hex
 * @param {string} rgb - RGB color string (e.g., "rgb(255, 0, 0)")
 * @returns {string} Hex color string (e.g., "#ff0000")
 */
function rgbToHex(rgb) {
  // Match rgb() or rgba() format
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Set the viewport size for responsive testing
 * @param {number} width - Viewport width in pixels
 * @param {number} height - Viewport height in pixels
 */
export function setViewportSize(width, height) {
  // Store original values
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  // Set new viewport size
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));

  // Return a cleanup function
  return () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalHeight
    });
    window.dispatchEvent(new Event('resize'));
  };
}

/**
 * Wait for an animation to complete on an element
 * @param {HTMLElement} element - The element with animation
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<void>} Resolves when animation completes or timeout
 */
export function waitForAnimation(element, timeout = 1000) {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const checkAnimation = () => {
      const style = getComputedStyle(element);
      const animationName = style.animationName;
      const transitionDuration = parseFloat(style.transitionDuration);
      
      // Check if element is animating
      const isAnimating = (animationName && animationName !== 'none') || 
                         transitionDuration > 0;
      
      // Resolve if not animating or timeout reached
      if (!isAnimating || Date.now() - start > timeout) {
        resolve();
      } else {
        requestAnimationFrame(checkAnimation);
      }
    };
    
    checkAnimation();
  });
}

/**
 * Wait for a specific duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>} Resolves after the specified duration
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get all CSS custom properties (variables) from an element
 * @param {HTMLElement} element - The element to inspect
 * @returns {Object} Object with CSS variable names as keys and values
 */
export function getCSSVariables(element = document.documentElement) {
  const styles = getComputedStyle(element);
  const variables = {};
  
  // Get all CSS properties
  for (let i = 0; i < styles.length; i++) {
    const name = styles[i];
    if (name.startsWith('--')) {
      variables[name] = styles.getPropertyValue(name).trim();
    }
  }
  
  return variables;
}

/**
 * Check if an element uses CSS variables for styling
 * @param {HTMLElement} element - The element to check
 * @param {string[]} properties - CSS properties to check (e.g., ['color', 'background-color'])
 * @returns {boolean} True if any property uses CSS variables
 */
export function usesCSSVariables(element, properties = ['color', 'background-color']) {
  const styles = getComputedStyle(element);
  
  return properties.some(prop => {
    const value = styles.getPropertyValue(prop);
    return value && value.includes('var(');
  });
}

/**
 * Get the computed spacing value for an element
 * @param {HTMLElement} element - The element to inspect
 * @param {string} property - Spacing property (e.g., 'margin', 'padding')
 * @returns {Object} Object with top, right, bottom, left values in pixels
 */
export function getSpacing(element, property = 'margin') {
  const styles = getComputedStyle(element);
  return {
    top: parseFloat(styles.getPropertyValue(`${property}-top`)),
    right: parseFloat(styles.getPropertyValue(`${property}-right`)),
    bottom: parseFloat(styles.getPropertyValue(`${property}-bottom`)),
    left: parseFloat(styles.getPropertyValue(`${property}-left`))
  };
}

/**
 * Check if a path is relative (not absolute)
 * @param {string} path - The path to check
 * @returns {boolean} True if the path is relative
 */
export function isRelativePath(path) {
  // Absolute paths start with /, http://, https://, or //
  return !path.match(/^(https?:)?\/\//i) && !path.startsWith('/');
}

/**
 * Extract all resource URLs from the document
 * @returns {Object} Object with arrays of CSS, JS, and image URLs
 */
export function getResourceURLs() {
  const resources = {
    css: [],
    js: [],
    images: []
  };

  // Get CSS files
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    resources.css.push(link.href);
  });

  // Get JavaScript files
  document.querySelectorAll('script[src]').forEach(script => {
    resources.js.push(script.src);
  });

  // Get images
  document.querySelectorAll('img[src]').forEach(img => {
    resources.images.push(img.src);
  });

  return resources;
}
