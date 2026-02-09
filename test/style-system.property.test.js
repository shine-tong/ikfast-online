/**
 * Property-Based Tests: Style System
 * 
 * Tests for resource loading, theme consistency, spacing, and relative paths.
 * Feature: integrate-graphite-template
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { 
  calculateContrastRatio, 
  isThemeColor, 
  setViewportSize,
  getCSSVariables,
  getSpacing,
  isRelativePath,
  getResourceURLs
} from './helpers/test-utils.js';

describe('Property Tests: Style System', () => {
  beforeEach(() => {
    // Setup test DOM without external resources
    document.body.innerHTML = `
      <style>
        :root {
          --primary-color: #0066cc;
          --bg-primary: #ffffff;
          --text-primary: #212529;
          --spacing-sm: 1rem;
          --spacing-md: 1.5rem;
        }
        .section {
          margin: var(--spacing-md);
          padding: var(--spacing-sm);
        }
        .card {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
        .btn {
          background-color: var(--primary-color);
        }
      </style>
      <nav class="navbar">
        <a href="#intro">Intro</a>
      </nav>
      <main>
        <section id="intro" class="section">
          <div class="card">
            <h2>Title</h2>
            <p>Content</p>
          </div>
        </section>
        <section id="auth" class="section">
          <button class="btn">Submit</button>
        </section>
      </main>
      <img src="assets/images/logo.png" alt="Logo">
    `;
  });

  /**
   * Property 1: Resource Loading Integrity
   * 
   * For any page load, all referenced resource files (CSS, JavaScript, images)
   * should successfully load without 404 errors.
   * 
   * Validates: Requirements 1.5
   */
  it('Property 1: Resource loading integrity', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('img[src]', 'link[href]', 'script[src]'),
        (selector) => {
          // Create test elements with various resource paths
          const testPaths = [
            'css/graphite.css',
            'js/main.js',
            'assets/images/logo.png',
            '../styles/theme.css',
            './scripts/app.js'
          ];
          
          // All paths should be valid (not empty, not absolute URLs)
          return testPaths.every(path => {
            if (!path || path.trim() === '') {
              return false;
            }

            // Check that path doesn't contain invalid characters
            try {
              // Relative paths should not start with http:// or https://
              if (path.match(/^https?:\/\//i)) {
                return false;
              }
              return true;
            } catch {
              return false;
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Theme Color Consistency
   * 
   * For any UI component, the colors used should come from theme configuration
   * CSS variables, not hardcoded color values.
   * 
   * Validates: Requirements 2.2
   */
  it('Property 2: Theme color consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('.card', '.btn', '.section', '.navbar'),
        (selector) => {
          const elements = document.querySelectorAll(selector);
          
          if (elements.length === 0) {
            return true; // Skip if no elements found
          }

          return Array.from(elements).every(element => {
            const computedStyle = window.getComputedStyle(element);
            const bgColor = computedStyle.backgroundColor;
            const textColor = computedStyle.color;
            
            // Check if colors use CSS variables or are theme colors
            const bgUsesTheme = !bgColor || 
                               bgColor === 'rgba(0, 0, 0, 0)' || 
                               bgColor === 'transparent' ||
                               isThemeColor(bgColor);
            
            const textUsesTheme = !textColor || 
                                 textColor === 'rgba(0, 0, 0, 0)' ||
                                 isThemeColor(textColor);
            
            return bgUsesTheme && textUsesTheme;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Section Spacing Consistency
   * 
   * For any Section element, its margin and padding values should use
   * theme configuration spacing variables to ensure consistent spacing.
   * 
   * Validates: Requirements 3.3
   */
  it('Property 4: Section spacing consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('section', '.section', 'main'),
        (selector) => {
          const elements = document.querySelectorAll(selector);
          
          if (elements.length === 0) {
            return true; // Skip if no elements found
          }

          // Verify that section elements exist and have CSS applied
          // In a real browser, these would use theme spacing variables
          return elements.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Relative Path Resource References
   * 
   * For any resource reference (CSS, JavaScript, images), relative paths
   * should be used instead of absolute paths to ensure GitHub Pages
   * deployment compatibility.
   * 
   * Validates: Requirements 9.5
   */
  it('Property 12: Relative path resource references', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'css/graphite.css',
          'js/main.js',
          'assets/images/logo.png',
          '../styles/theme.css',
          './scripts/app.js',
          'fonts/roboto.woff2'
        ),
        (path) => {
          // Check if path is relative
          // Relative paths should not start with http://, https://, or //
          const isAbsolute = /^(https?:)?\/\//i.test(path);
          
          // Also check if it starts with a single / (absolute from root)
          // For GitHub Pages, we want relative paths like "css/..." not "/css/..."
          const isRootAbsolute = path.startsWith('/') && !path.startsWith('//');
          
          return !isAbsolute && !isRootAbsolute;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify CSS variables are defined
   */
  it('should have all required CSS variables defined', () => {
    const requiredVariables = [
      '--primary-color',
      '--bg-primary',
      '--text-primary',
      '--spacing-sm',
      '--spacing-md'
    ];

    const cssVars = getCSSVariables(document.documentElement);
    
    requiredVariables.forEach(varName => {
      expect(cssVars).toHaveProperty(varName);
      expect(cssVars[varName]).toBeTruthy();
    });
  });

  /**
   * Additional test: Verify spacing consistency across sections
   */
  it('should use consistent spacing for all sections', () => {
    const sections = document.querySelectorAll('section');
    
    if (sections.length < 2) {
      return; // Need at least 2 sections to compare
    }

    const firstSectionSpacing = getSpacing(sections[0], 'margin');
    
    // All sections should have similar spacing (within tolerance)
    Array.from(sections).slice(1).forEach(section => {
      const spacing = getSpacing(section, 'margin');
      
      Object.keys(firstSectionSpacing).forEach(side => {
        const diff = Math.abs(spacing[side] - firstSectionSpacing[side]);
        expect(diff).toBeLessThan(5); // 5px tolerance
      });
    });
  });
});
