/**
 * Unit tests for UI components
 * Tests tooltip display, responsive layout, and accessibility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Window } from 'happy-dom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('UI Components', () => {
    let window;
    let document;

    beforeEach(() => {
        // Load the actual HTML file
        const html = fs.readFileSync(path.resolve(__dirname, '../web/index.html'), 'utf-8');
        window = new Window();
        document = window.document;
        document.write(html);
    });

    afterEach(() => {
        // Happy-dom doesn't need explicit close
        window = null;
        document = null;
    });

    describe('Tooltip Display', () => {
        it('should have help icons for technical terms', () => {
            const helpIcons = document.querySelectorAll('.help-icon');
            
            // Should have at least 3 help icons (Base Link, EE Link, IKType)
            expect(helpIcons.length).toBeGreaterThanOrEqual(3);
        });

        it('should have title attributes on help icons', () => {
            const helpIcons = document.querySelectorAll('.help-icon');
            
            helpIcons.forEach(icon => {
                expect(icon.hasAttribute('title')).toBe(true);
                expect(icon.getAttribute('title').length).toBeGreaterThan(0);
            });
        });

        it('should have descriptive tooltips for Base Link', () => {
            const baseLinkLabel = document.querySelector('label[for="base-link"]');
            const helpIcon = baseLinkLabel.querySelector('.help-icon');
            
            expect(helpIcon).toBeTruthy();
            const tooltip = helpIcon.getAttribute('title');
            expect(tooltip).toContain('基座');
            expect(tooltip.length).toBeGreaterThan(10);
        });

        it('should have descriptive tooltips for End Effector Link', () => {
            const eeLinkLabel = document.querySelector('label[for="ee-link"]');
            const helpIcon = eeLinkLabel.querySelector('.help-icon');
            
            expect(helpIcon).toBeTruthy();
            const tooltip = helpIcon.getAttribute('title');
            expect(tooltip).toContain('末端');
            expect(tooltip.length).toBeGreaterThan(10);
        });

        it('should have descriptive tooltips for IKType', () => {
            const iktypeLabel = document.querySelector('label[for="iktype"]');
            const helpIcon = iktypeLabel.querySelector('.help-icon');
            
            expect(helpIcon).toBeTruthy();
            const tooltip = helpIcon.getAttribute('title');
            expect(tooltip).toContain('IKFast');
            expect(tooltip.length).toBeGreaterThan(10);
        });

        it('should have help text for form fields', () => {
            const helpTexts = document.querySelectorAll('.help-text');
            
            // Should have help text for at least the main form fields
            expect(helpTexts.length).toBeGreaterThan(0);
            
            helpTexts.forEach(helpText => {
                expect(helpText.textContent.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Responsive Layout', () => {
        it('should have responsive container', () => {
            const container = document.querySelector('.container');
            expect(container).toBeTruthy();
        });

        it('should have all required sections', () => {
            const sections = [
                '.intro-section',
                '.instructions-section',
                '.auth-section',
                '.upload-section',
                '.link-info-section',
                '.config-section',
                '.status-section',
                '.log-section',
                '.download-section',
                '.faq-section'
            ];

            sections.forEach(selector => {
                const section = document.querySelector(selector);
                expect(section).toBeTruthy();
            });
        });

        it('should have flexible layout for upload area', () => {
            const uploadArea = document.querySelector('.upload-area');
            expect(uploadArea).toBeTruthy();
            
            const uploadControls = uploadArea.querySelector('.upload-controls');
            expect(uploadControls).toBeTruthy();
        });

        it('should have flexible layout for download buttons', () => {
            const downloadButtons = document.querySelector('.download-buttons');
            expect(downloadButtons).toBeTruthy();
            
            const buttons = downloadButtons.querySelectorAll('button');
            expect(buttons.length).toBeGreaterThanOrEqual(2);
        });

        it('should have flexible layout for status display', () => {
            const statusDisplay = document.querySelector('.status-display');
            expect(statusDisplay).toBeTruthy();
            
            const statusIndicator = statusDisplay.querySelector('.status-indicator');
            const statusMessage = statusDisplay.querySelector('.status-message');
            
            expect(statusIndicator).toBeTruthy();
            expect(statusMessage).toBeTruthy();
        });
    });

    describe('Accessibility', () => {
        it('should have proper HTML lang attribute', () => {
            const html = document.documentElement;
            expect(html.getAttribute('lang')).toBe('zh-CN');
        });

        it('should have proper page title', () => {
            const title = document.querySelector('title');
            expect(title.textContent).toBe('IKFast Online Generator');
        });

        it('should have proper heading hierarchy', () => {
            const h1 = document.querySelector('h1');
            expect(h1).toBeTruthy();
            expect(h1.textContent).toContain('IKFast');
            
            const h2s = document.querySelectorAll('h2');
            expect(h2s.length).toBeGreaterThan(0);
        });

        it('should have labels for all form inputs', () => {
            const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="number"], select');
            
            inputs.forEach(input => {
                const id = input.getAttribute('id');
                if (id && id !== 'file-input' && id !== 'auto-scroll') {
                    const label = document.querySelector(`label[for="${id}"]`);
                    expect(label).toBeTruthy();
                }
            });
        });

        it('should have proper button text', () => {
            const buttons = document.querySelectorAll('button');
            
            buttons.forEach(button => {
                // Buttons should have text content or aria-label
                const hasText = button.textContent.trim().length > 0;
                const hasAriaLabel = button.hasAttribute('aria-label');
                
                expect(hasText || hasAriaLabel).toBe(true);
            });
        });

        it('should have semantic HTML structure', () => {
            expect(document.querySelector('header')).toBeTruthy();
            expect(document.querySelector('main')).toBeTruthy();
            expect(document.querySelector('footer')).toBeTruthy();
            
            const sections = document.querySelectorAll('section');
            expect(sections.length).toBeGreaterThan(0);
        });

        it('should have proper input types', () => {
            const passwordInput = document.querySelector('#github-token');
            expect(passwordInput.getAttribute('type')).toBe('password');
            
            const numberInputs = document.querySelectorAll('#base-link, #ee-link');
            numberInputs.forEach(input => {
                expect(input.getAttribute('type')).toBe('number');
                expect(input.hasAttribute('min')).toBe(true);
            });
        });

        it('should have keyboard navigation support for file input', () => {
            const fileInput = document.querySelector('#file-input');
            expect(fileInput).toBeTruthy();
            expect(fileInput.getAttribute('type')).toBe('file');
        });

        it('should have proper checkbox for auto-scroll', () => {
            const autoScrollCheckbox = document.querySelector('#auto-scroll');
            expect(autoScrollCheckbox).toBeTruthy();
            expect(autoScrollCheckbox.getAttribute('type')).toBe('checkbox');
            
            // Should have a label
            const label = autoScrollCheckbox.closest('label');
            expect(label).toBeTruthy();
        });

        it('should have details/summary for FAQ (keyboard accessible)', () => {
            const details = document.querySelectorAll('.faq-section details');
            expect(details.length).toBeGreaterThan(0);
            
            details.forEach(detail => {
                const summary = detail.querySelector('summary');
                expect(summary).toBeTruthy();
            });
        });

        it('should have external links with target="_blank"', () => {
            const externalLinks = document.querySelectorAll('a[href^="http"]');
            
            externalLinks.forEach(link => {
                expect(link.getAttribute('target')).toBe('_blank');
            });
        });

        it('should have proper placeholder text', () => {
            const tokenInput = document.querySelector('#github-token');
            expect(tokenInput.getAttribute('placeholder')).toBeTruthy();
            
            const baseLinkInput = document.querySelector('#base-link');
            expect(baseLinkInput.getAttribute('placeholder')).toBeTruthy();
            
            const eeLinkInput = document.querySelector('#ee-link');
            expect(eeLinkInput.getAttribute('placeholder')).toBeTruthy();
        });
    });

    describe('FAQ Section', () => {
        it('should have comprehensive FAQ entries', () => {
            const faqDetails = document.querySelectorAll('.faq-section details');
            
            // Should have at least 5 FAQ entries
            expect(faqDetails.length).toBeGreaterThanOrEqual(5);
        });

        it('should have FAQ about GitHub Token', () => {
            const summaries = Array.from(document.querySelectorAll('.faq-section summary'));
            const tokenFAQ = summaries.find(s => s.textContent.includes('GitHub') && s.textContent.includes('Token'));
            
            expect(tokenFAQ).toBeTruthy();
        });

        it('should have FAQ about URDF files', () => {
            const summaries = Array.from(document.querySelectorAll('.faq-section summary'));
            const urdfFAQ = summaries.find(s => s.textContent.includes('URDF'));
            
            expect(urdfFAQ).toBeTruthy();
        });

        it('should have FAQ about Base Link and End Effector Link', () => {
            const summaries = Array.from(document.querySelectorAll('.faq-section summary'));
            const linkFAQ = summaries.find(s => 
                s.textContent.includes('Base Link') || s.textContent.includes('End Effector')
            );
            
            expect(linkFAQ).toBeTruthy();
        });

        it('should have link to example URDF files', () => {
            const faqSection = document.querySelector('.faq-section');
            const links = faqSection.querySelectorAll('a[href*="github.com"]');
            
            expect(links.length).toBeGreaterThan(0);
        });

        it('should have detailed FAQ content', () => {
            const faqDetails = document.querySelectorAll('.faq-section details');
            
            faqDetails.forEach(detail => {
                const content = detail.querySelector('p');
                expect(content).toBeTruthy();
                expect(content.textContent.length).toBeGreaterThan(20);
            });
        });
    });

    describe('Step-by-Step Instructions', () => {
        it('should have instructions section', () => {
            const instructionsSection = document.querySelector('.instructions-section');
            expect(instructionsSection).toBeTruthy();
        });

        it('should have ordered list of steps', () => {
            const instructionsList = document.querySelector('.instructions-section ol');
            expect(instructionsList).toBeTruthy();
            
            const steps = instructionsList.querySelectorAll('li');
            expect(steps.length).toBeGreaterThanOrEqual(5);
        });

        it('should have clear step descriptions', () => {
            const steps = document.querySelectorAll('.instructions-section li');
            
            steps.forEach(step => {
                expect(step.textContent.length).toBeGreaterThan(10);
            });
        });
    });

    describe('Visual Feedback Elements', () => {
        it('should have progress bar for upload', () => {
            const progressBar = document.querySelector('#upload-progress');
            expect(progressBar).toBeTruthy();
            expect(progressBar.classList.contains('progress-bar')).toBe(true);
            
            const progressFill = progressBar.querySelector('.progress-fill');
            expect(progressFill).toBeTruthy();
        });

        it('should have status indicator', () => {
            const statusIndicator = document.querySelector('#status-indicator');
            expect(statusIndicator).toBeTruthy();
            expect(statusIndicator.classList.contains('status-indicator')).toBe(true);
        });

        it('should have log viewer', () => {
            const logViewer = document.querySelector('#log-viewer');
            expect(logViewer).toBeTruthy();
            expect(logViewer.classList.contains('log-viewer')).toBe(true);
            
            const logContent = logViewer.querySelector('#log-content');
            expect(logContent).toBeTruthy();
        });

        it('should have file size display elements', () => {
            const solverSize = document.querySelector('#solver-size');
            const logSize = document.querySelector('#log-size');
            
            expect(solverSize).toBeTruthy();
            expect(logSize).toBeTruthy();
        });
    });

    describe('Introduction Section', () => {
        it('should have introduction section', () => {
            const introSection = document.querySelector('.intro-section');
            expect(introSection).toBeTruthy();
        });

        it('should explain platform purpose', () => {
            const introSection = document.querySelector('.intro-section');
            const paragraphs = introSection.querySelectorAll('p');
            
            expect(paragraphs.length).toBeGreaterThan(0);
            
            const text = Array.from(paragraphs).map(p => p.textContent).join(' ');
            expect(text).toContain('IKFast');
            expect(text).toContain('URDF');
        });
    });
});
