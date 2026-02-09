/**
 * Checkpoint Verification Tests
 * Task 8: 基础功能验证
 * 
 * This test suite verifies that:
 * 1. Page loads correctly with all resources
 * 2. Navigation functionality works
 * 3. All existing functional modules are accessible
 * 4. Styles are correctly applied
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 8: Basic Functionality Verification', () => {
  const htmlPath = path.join(process.cwd(), 'docs', 'index.html');
  let htmlContent;

  // Load HTML content once for all tests
  try {
    htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  } catch (error) {
    console.error('Failed to load HTML file:', error);
  }

  describe('1. Page Structure and Resource Loading', () => {
    it('should have HTML file that exists', () => {
      expect(htmlContent).toBeTruthy();
      expect(htmlContent.length).toBeGreaterThan(0);
    });

    it('should have proper HTML structure with head and body', () => {
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('</head>');
      expect(htmlContent).toContain('<body>');
      expect(htmlContent).toContain('</body>');
    });

    it('should reference all required CSS files', () => {
      const cssFiles = [
        'css/graphite-theme.css',
        'css/graphite.css',
        'css/responsive.css',
        'css/custom.css'
      ];

      cssFiles.forEach(cssFile => {
        expect(htmlContent).toContain(cssFile);
      });
    });

    it('should have proper meta tags for responsive design', () => {
      expect(htmlContent).toContain('name="viewport"');
      expect(htmlContent).toContain('width=device-width');
    });

    it('should verify CSS files exist on disk', () => {
      const cssFiles = [
        'docs/css/graphite-theme.css',
        'docs/css/graphite.css',
        'docs/css/responsive.css',
        'docs/css/custom.css'
      ];

      cssFiles.forEach(cssFile => {
        const fullPath = path.join(process.cwd(), cssFile);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('2. Navigation Structure', () => {
    it('should have navigation bar with proper structure', () => {
      expect(htmlContent).toContain('class="navbar"');
      expect(htmlContent).toContain('role="navigation"');
    });

    it('should have brand section in navigation', () => {
      expect(htmlContent).toContain('class="navbar-brand"');
      expect(htmlContent).toContain('class="brand-title"');
      expect(htmlContent).toContain('IKFast');
    });

    it('should have navigation menu with all required links', () => {
      expect(htmlContent).toContain('class="navbar-menu"');
      
      const expectedSections = ['intro', 'auth', 'upload', 'links', 'config', 'status', 'logs', 'download'];
      
      expectedSections.forEach(sectionId => {
        expect(htmlContent).toContain(`href="#${sectionId}"`);
      });
    });

    it('should have hamburger menu button for mobile', () => {
      expect(htmlContent).toContain('class="navbar-toggler"');
      expect(htmlContent).toContain('aria-label');
    });
  });

  describe('3. Main Content Sections', () => {
    it('should have main element with proper role', () => {
      expect(htmlContent).toContain('<main');
      expect(htmlContent).toContain('role="main"');
    });

    it('should have all required functional sections', () => {
      const requiredSections = [
        'intro',
        'auth',
        'upload',
        'links',
        'config',
        'status',
        'logs',
        'download'
      ];

      requiredSections.forEach(sectionId => {
        expect(htmlContent).toContain(`id="${sectionId}"`);
        expect(htmlContent).toContain('class="section');
      });
    });

    it('should have section headers with titles', () => {
      expect(htmlContent).toContain('class="section-header"');
      expect(htmlContent).toContain('class="section-title"');
    });

    it('should have card components in sections', () => {
      expect(htmlContent).toContain('class="card"');
      expect(htmlContent).toContain('class="card-body"');
    });
  });

  describe('4. Authentication Module', () => {
    it('should have authentication section with form elements', () => {
      expect(htmlContent).toContain('id="auth"');
      expect(htmlContent).toContain('id="github-token"');
      expect(htmlContent).toContain('type="password"');
      expect(htmlContent).toContain('id="auth-button"');
    });

    it('should have proper form styling classes', () => {
      expect(htmlContent).toContain('class="form-group"');
      expect(htmlContent).toContain('class="form-label"');
      expect(htmlContent).toContain('class="form-input"');
    });
  });

  describe('5. File Upload Module', () => {
    it('should have file upload section with required elements', () => {
      expect(htmlContent).toContain('id="upload"');
      expect(htmlContent).toContain('id="file-input"');
      expect(htmlContent).toContain('type="file"');
      expect(htmlContent).toContain('accept=".urdf"');
      expect(htmlContent).toContain('id="upload-button"');
    });

    it('should have progress bar element', () => {
      expect(htmlContent).toContain('id="upload-progress"');
      expect(htmlContent).toContain('class="progress-bar"');
    });
  });

  describe('6. Parameter Configuration Module', () => {
    it('should have parameter configuration section', () => {
      expect(htmlContent).toContain('id="config"');
      expect(htmlContent).toContain('id="base-link"');
      expect(htmlContent).toContain('type="number"');
      expect(htmlContent).toContain('id="ee-link"');
      expect(htmlContent).toContain('id="iktype"');
    });

    it('should have submit button', () => {
      expect(htmlContent).toContain('id="submit-button"');
      expect(htmlContent).toContain('class="btn');
    });
  });

  describe('7. Status Monitor Module', () => {
    it('should have status monitoring section', () => {
      expect(htmlContent).toContain('id="status"');
      expect(htmlContent).toContain('id="status-indicator"');
    });
  });

  describe('8. Log Viewer Module', () => {
    it('should have log viewer section', () => {
      expect(htmlContent).toContain('id="logs"');
      expect(htmlContent).toContain('id="log-viewer"');
      expect(htmlContent).toContain('class="log-viewer"');
      expect(htmlContent).toContain('id="log-content"');
    });

    it('should have auto-scroll checkbox', () => {
      expect(htmlContent).toContain('id="auto-scroll"');
      expect(htmlContent).toContain('type="checkbox"');
    });
  });

  describe('9. Download Module', () => {
    it('should have download section with buttons', () => {
      expect(htmlContent).toContain('id="download"');
      expect(htmlContent).toContain('id="download-solver"');
      expect(htmlContent).toContain('id="download-log"');
    });
  });

  describe('10. JavaScript Module References', () => {
    it('should reference navigation.js', () => {
      expect(htmlContent).toContain('src="js/navigation.js"');
    });

    it('should reference animations.js', () => {
      expect(htmlContent).toContain('src="js/animations.js"');
    });

    it('should reference ui-adapter.js', () => {
      expect(htmlContent).toContain('src="js/ui-adapter.js"');
    });

    it('should reference main.js', () => {
      expect(htmlContent).toContain('src="main.js"');
    });

    it('should verify JavaScript files exist on disk', () => {
      const jsFiles = [
        'docs/js/navigation.js',
        'docs/js/animations.js',
        'docs/js/ui-adapter.js',
        'docs/js/main.js'
      ];

      jsFiles.forEach(jsFile => {
        const fullPath = path.join(process.cwd(), jsFile);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('11. Semantic HTML and Accessibility', () => {
    it('should use semantic HTML5 elements', () => {
      expect(htmlContent).toContain('<nav');
      expect(htmlContent).toContain('<main');
      expect(htmlContent).toContain('<footer');
      expect(htmlContent).toContain('<section');
    });

    it('should have proper ARIA attributes on navigation', () => {
      expect(htmlContent).toContain('role="navigation"');
      expect(htmlContent).toContain('aria-label');
    });

    it('should have proper ARIA attributes on hamburger menu', () => {
      const navSection = htmlContent.substring(
        htmlContent.indexOf('class="navbar-toggler"'),
        htmlContent.indexOf('class="navbar-toggler"') + 200
      );
      expect(navSection).toContain('aria-label');
    });
  });

  describe('12. Footer', () => {
    it('should have footer with proper structure', () => {
      expect(htmlContent).toContain('<footer');
      expect(htmlContent).toContain('class="footer"');
      expect(htmlContent).toContain('role="contentinfo"');
    });
  });

  describe('13. Style Application Verification', () => {
    it('should have cards with proper classes', () => {
      expect(htmlContent).toContain('class="card"');
    });

    it('should have buttons with proper classes', () => {
      expect(htmlContent).toContain('class="btn');
    });

    it('should have form elements with proper classes', () => {
      expect(htmlContent).toContain('class="form-input"');
    });
  });

  describe('14. Data Attributes for Animations', () => {
    it('should have sections with data-animate attributes', () => {
      expect(htmlContent).toContain('data-animate');
    });
  });
});
