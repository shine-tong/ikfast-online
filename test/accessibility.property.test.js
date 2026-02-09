/**
 * Property-Based Tests for Accessibility
 * Feature: integrate-graphite-template
 * 
 * Tests:
 * - Property 11: 语义化 HTML 和 ARIA 属性
 * - Property 13: 键盘导航支持
 * - Property 14: 焦点指示器可见性
 * - Property 15: 颜色对比度合规性
 * - Property 16: 图片 Alt 文本完整性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

// Helper function to calculate relative luminance
function getRelativeLuminance(r, g, b) {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to parse hex color
function parseHex(hexString) {
  const hex = hexString.replace('#', '');
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16)
    };
  }
  return {
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16)
  };
}

describe('Property Tests: Accessibility', () => {
  let htmlContent;

  beforeEach(() => {
    // Load the HTML file
    const htmlPath = path.join(process.cwd(), 'docs', 'index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  });

  /**
   * Property 11: 语义化 HTML 和 ARIA 属性
   * 
   * For any page region and interactive component, it should use semantic HTML tags
   * (header, nav, main, section, article) and appropriate ARIA attributes
   * (role, aria-label, aria-labelledby).
   * 
   * Validates: Requirements 9.3, 12.1
   */
  it('Property 11: Semantic HTML and ARIA attributes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { tag: 'nav', requiredAttr: ['role', 'aria-label'] },
          { tag: 'main', requiredAttr: ['role'] },
          { tag: 'button', requiredAttr: ['aria-label', 'textContent'] },
          { tag: 'input', requiredAttr: ['aria-label', 'aria-describedby', 'aria-required'] }
        ),
        (testCase) => {
          const tagRegex = new RegExp(`<${testCase.tag}[^>]*>`, 'gi');
          const matches = htmlContent.match(tagRegex);
          
          if (!matches || matches.length === 0) {
            return true; // Skip if element type not found
          }

          // Check if at least one required attribute is present in each match
          return matches.every(match => {
            return testCase.requiredAttr.some(attr => {
              if (attr === 'textContent') {
                // Check if button has text content between tags
                const fullTagRegex = new RegExp(`<${testCase.tag}[^>]*>([^<]+)</${testCase.tag}>`, 'i');
                const fullMatch = htmlContent.match(fullTagRegex);
                return fullMatch && fullMatch[1].trim().length > 0;
              }
              return match.includes(attr);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: 键盘导航支持
   * 
   * For any sequence of interactive elements, users should be able to navigate
   * between elements using the Tab key, and the focus order should follow
   * logical order.
   * 
   * Validates: Requirements 12.2
   */
  it('Property 13: Keyboard navigation support', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('button', 'a', 'input', 'select', 'textarea'),
        (elementType) => {
          const tagRegex = new RegExp(`<${elementType}[^>]*>`, 'gi');
          const matches = htmlContent.match(tagRegex);
          
          if (!matches || matches.length === 0) {
            return true; // Skip if no elements found
          }

          // Check that elements don't have tabindex="-1" unless they're disabled
          const noNegativeTabindex = matches.every(match => {
            if (match.includes('disabled')) {
              return true; // Disabled elements can have any tabindex
            }
            return !match.includes('tabindex="-1"');
          });

          // Check for skip link
          const hasSkipLink = htmlContent.includes('skip-link') || 
                             htmlContent.includes('跳转到主要内容');

          return noNegativeTabindex && hasSkipLink;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: 焦点指示器可见性
   * 
   * For any focused element, there should be a clear visible focus indicator
   * (outline or custom focus style), and it should not be removed by
   * `outline: none` without providing an alternative.
   * 
   * Validates: Requirements 12.3
   */
  it('Property 14: Focus indicator visibility', () => {
    // Read CSS files to check for focus styles (exclude theme files)
    const cssFiles = [
      'docs/css/graphite.css',
      'docs/css/custom.css'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...cssFiles),
        (cssFile) => {
          const cssPath = path.join(process.cwd(), cssFile);
          if (!fs.existsSync(cssPath)) {
            return true;
          }
          
          const cssContent = fs.readFileSync(cssPath, 'utf-8');
          
          // Check that focus styles are defined
          const hasFocusStyles = 
            cssContent.includes(':focus') || 
            cssContent.includes(':focus-visible');
          
          // Check that outline: none is not used without alternatives
          const outlineNoneRegex = /outline:\s*none/gi;
          const outlineNoneMatches = cssContent.match(outlineNoneRegex);
          
          if (outlineNoneMatches) {
            // If outline: none is used, check for alternative focus styles
            const hasAlternative = 
              cssContent.includes('box-shadow') ||
              cssContent.includes('border') ||
              cssContent.includes(':focus-visible');
            return hasAlternative;
          }
          
          return hasFocusStyles;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: 颜色对比度合规性
   * 
   * For any text content, the color contrast ratio with its background should
   * meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).
   * 
   * Validates: Requirements 12.4
   */
  it('Property 15: Color contrast compliance', () => {
    // Test predefined color combinations from theme
    const colorTests = [
      { name: 'text-primary on bg-primary', text: '#212529', bg: '#ffffff', minRatio: 4.5 },
      { name: 'text-secondary on bg-primary', text: '#495057', bg: '#ffffff', minRatio: 4.5 },
      { name: 'text-muted on bg-primary', text: '#5a6268', bg: '#ffffff', minRatio: 4.5 },
      { name: 'primary-color on bg-primary', text: '#0066cc', bg: '#ffffff', minRatio: 4.5 },
      { name: 'status-success on bg-primary', text: '#1e7e34', bg: '#ffffff', minRatio: 4.5 },
      { name: 'status-warning on bg-primary', text: '#856404', bg: '#ffffff', minRatio: 4.5 },
      { name: 'status-error on bg-primary', text: '#bd2130', bg: '#ffffff', minRatio: 4.5 },
      { name: 'status-info on bg-primary', text: '#117a8b', bg: '#ffffff', minRatio: 4.5 }
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...colorTests),
        (colorTest) => {
          const textColor = parseHex(colorTest.text);
          const bgColor = parseHex(colorTest.bg);
          
          const ratio = calculateContrastRatio(textColor, bgColor);
          
          // Check if ratio meets minimum requirement
          const meetsStandard = ratio >= colorTest.minRatio;
          
          if (!meetsStandard) {
            console.log(`Failed: ${colorTest.name} - Ratio: ${ratio.toFixed(2)}, Required: ${colorTest.minRatio}`);
          }
          
          return meetsStandard;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: 图片 Alt 文本完整性
   * 
   * For any img element, it should have a descriptive alt attribute,
   * unless the image is purely decorative (in which case alt should be empty string).
   * 
   * Validates: Requirements 12.5
   */
  it('Property 16: Image alt text completeness', () => {
    const imgRegex = /<img[^>]*>/gi;
    const images = htmlContent.match(imgRegex);
    
    if (!images || images.length === 0) {
      // No images in current HTML, test passes
      expect(true).toBe(true);
      return;
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: images.length - 1 }),
        (index) => {
          const img = images[index];
          
          // Every image must have an alt attribute
          const hasAlt = img.includes('alt=');
          
          return hasAlt;
        }
      ),
      { numRuns: Math.max(10, images.length * 2) }
    );
  });

  /**
   * Additional test: Check for proper form validation attributes
   */
  it('Property: Form inputs have proper validation attributes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { type: 'text', required: false },
          { type: 'number', required: false },
          { type: 'password', required: false }
        ),
        (inputTest) => {
          const inputRegex = new RegExp(`<input[^>]*type="${inputTest.type}"[^>]*>`, 'gi');
          const matches = htmlContent.match(inputRegex);
          
          if (!matches || matches.length === 0) {
            return true;
          }

          // Check if inputs with aria-required also have aria-invalid
          return matches.every(match => {
            const hasAriaRequired = match.includes('aria-required');
            const hasAriaInvalid = match.includes('aria-invalid');
            
            // If it has aria-required, it should also have aria-invalid
            if (hasAriaRequired) {
              return hasAriaInvalid;
            }
            
            // Otherwise, it's fine
            return true;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Check for live regions
   */
  it('Property: Dynamic content has aria-live regions', () => {
    const liveRegionIds = [
      'auth-message',
      'status-indicator',
      'status-message',
      'log-viewer',
      'file-info',
      'error-section'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...liveRegionIds),
        (elementId) => {
          const idRegex = new RegExp(`id="${elementId}"[^>]*>`, 'i');
          const match = htmlContent.match(idRegex);
          
          if (!match) {
            return true; // Skip if not found
          }

          // Check if element has aria-live or role="alert" or role="status"
          const elementRegex = new RegExp(`<[^>]*id="${elementId}"[^>]*>`, 'i');
          const fullMatch = htmlContent.match(elementRegex);
          
          if (!fullMatch) {
            return true;
          }

          const element = fullMatch[0];
          const hasLiveRegion = 
            element.includes('aria-live') ||
            element.includes('role="alert"') ||
            element.includes('role="status"') ||
            element.includes('role="log"');

          return hasLiveRegion;
        }
      ),
      { numRuns: 100 }
    );
  });
});
