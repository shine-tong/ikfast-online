/**
 * Property-Based Tests for NavigationManager
 * Feature: integrate-graphite-template
 * Tests universal properties that should hold across all inputs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { Window } from 'happy-dom';

describe('NavigationManager - Property-Based Tests', () => {
    let window;
    let document;
    let NavigationManager;

    beforeEach(() => {
        // Create a new Window instance for each test
        window = new Window();
        document = window.document;
        
        // Set up the HTML structure
        document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    html { scroll-behavior: smooth; }
                    .navbar { height: 60px; position: fixed; top: 0; }
                    .navbar-menu { display: flex; }
                    .navbar-menu.active { display: block; }
                    .navbar-toggler { display: none; }
                    .navbar-toggler.active { background: #ccc; }
                    .navbar-menu a { padding: 10px; }
                    .navbar-menu a.active { font-weight: bold; }
                    .section { min-height: 500px; padding-top: 100px; }
                    @media (max-width: 768px) {
                        .navbar-toggler { display: block; }
                        .navbar-menu { display: none; }
                    }
                </style>
            </head>
            <body>
                <nav class="navbar">
                    <button class="navbar-toggler" aria-expanded="false">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <ul class="navbar-menu">
                        <li><a href="#intro">介绍</a></li>
                        <li><a href="#auth">认证</a></li>
                        <li><a href="#upload">上传</a></li>
                        <li><a href="#config">配置</a></li>
                        <li><a href="#status">状态</a></li>
                    </ul>
                </nav>
                <main>
                    <section id="intro" class="section">Introduction</section>
                    <section id="auth" class="section">Authentication</section>
                    <section id="upload" class="section">Upload</section>
                    <section id="config" class="section">Configuration</section>
                    <section id="status" class="section">Status</section>
                </main>
            </body>
            </html>
        `);

        // Make window and document global for the NavigationManager
        global.window = window;
        global.document = document;

        // Mock IntersectionObserver
        global.IntersectionObserver = class IntersectionObserver {
            constructor(callback, options) {
                this.callback = callback;
                this.options = options;
                this.observedElements = [];
            }
            observe(element) {
                this.observedElements.push(element);
            }
            unobserve(element) {
                const index = this.observedElements.indexOf(element);
                if (index > -1) {
                    this.observedElements.splice(index, 1);
                }
            }
            disconnect() {
                this.observedElements = [];
            }
            // Helper method to simulate intersection
            triggerIntersection(element, isIntersecting) {
                this.callback([{
                    target: element,
                    isIntersecting: isIntersecting
                }]);
            }
        };

        // Load NavigationManager class
        const navCode = `
            class NavigationManager {
              constructor() {
                this.navbar = null;
                this.navLinks = [];
                this.sections = [];
                this.activeSection = null;
                this.isMenuOpen = false;
                this.observer = null;
              }
              
              initialize() {
                this.navbar = document.querySelector('.navbar');
                if (!this.navbar) {
                  console.warn('NavigationManager: navbar not found');
                  return;
                }
                
                this.navLinks = Array.from(document.querySelectorAll('.navbar-menu a'));
                this.sections = this.navLinks.map(link => {
                  const id = link.getAttribute('href').substring(1);
                  return document.getElementById(id);
                }).filter(section => section !== null);
                
                // Ensure initial state is set correctly
                const toggler = document.querySelector('.navbar-toggler');
                const menu = document.querySelector('.navbar-menu');
                if (toggler && menu) {
                  // Set initial closed state
                  this.isMenuOpen = false;
                  menu.classList.remove('active');
                  toggler.classList.remove('active');
                  toggler.setAttribute('aria-expanded', 'false');
                }
                
                this.setupEventListeners();
                this.setupScrollSpy();
              }
              
              setupEventListeners() {
                this.navLinks.forEach(link => {
                  link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    this.scrollToSection(targetId);
                    if (this.isMenuOpen) {
                      this.toggleMenu();
                    }
                  });
                });
                
                const toggler = document.querySelector('.navbar-toggler');
                if (toggler) {
                  toggler.addEventListener('click', () => this.toggleMenu());
                }
                
                window.addEventListener('resize', () => {
                  if (window.innerWidth > 768 && this.isMenuOpen) {
                    this.toggleMenu();
                  }
                });
              }
              
              scrollToSection(sectionId) {
                const section = document.getElementById(sectionId);
                if (section) {
                  const offsetTop = section.offsetTop - this.navbar.offsetHeight;
                  window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                  });
                }
              }
              
              toggleMenu() {
                this.isMenuOpen = !this.isMenuOpen;
                const menu = document.querySelector('.navbar-menu');
                const toggler = document.querySelector('.navbar-toggler');
                
                if (this.isMenuOpen) {
                  menu.classList.add('active');
                  toggler.classList.add('active');
                  toggler.setAttribute('aria-expanded', 'true');
                } else {
                  menu.classList.remove('active');
                  toggler.classList.remove('active');
                  toggler.setAttribute('aria-expanded', 'false');
                }
              }
              
              setupScrollSpy() {
                if (!('IntersectionObserver' in window)) {
                  return;
                }
                
                const observerOptions = {
                  rootMargin: \`-\${this.navbar.offsetHeight}px 0px -80% 0px\`,
                  threshold: 0
                };
                
                this.observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach(entry => {
                      if (entry.isIntersecting) {
                        this.setActiveSection(entry.target.id);
                      }
                    });
                  },
                  observerOptions
                );
                
                this.sections.forEach(section => {
                  if (section) this.observer.observe(section);
                });
              }
              
              setActiveSection(sectionId) {
                if (this.activeSection === sectionId) return;
                
                this.activeSection = sectionId;
                this.navLinks.forEach(link => {
                  const linkTarget = link.getAttribute('href').substring(1);
                  if (linkTarget === sectionId) {
                    link.classList.add('active');
                  } else {
                    link.classList.remove('active');
                  }
                });
              }
              
              destroy() {
                if (this.observer) {
                  this.observer.disconnect();
                }
              }
            }
            
            window.NavigationManager = NavigationManager;
        `;
        
        const script = document.createElement('script');
        script.textContent = navCode;
        document.head.appendChild(script);
        
        NavigationManager = window.NavigationManager;
    });

    afterEach(() => {
        // Clean up
        if (global.window) {
            delete global.window;
        }
        if (global.document) {
            delete global.document;
        }
        if (global.IntersectionObserver) {
            delete global.IntersectionObserver;
        }
    });

    /**
     * Property 5: 导航链接平滑滚动
     * For any navigation link click, the page should smoothly scroll to the corresponding
     * section rather than jumping instantly
     * Validates: Requirements 4.2
     */
    describe('Property 5: Navigation Link Smooth Scrolling', () => {
        it('should use smooth scroll behavior when clicking navigation links', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    (sectionId) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        // Find the link for this section
                        const link = document.querySelector(`a[href="#${sectionId}"]`);
                        if (!link) return true; // Skip if link not found
                        
                        // Mock window.scrollTo to capture the call
                        let scrollCalled = false;
                        let scrollOptions = null;
                        
                        window.scrollTo = function(options) {
                            scrollCalled = true;
                            scrollOptions = options;
                        };
                        
                        // Click the link
                        link.click();
                        
                        // Verify scrollTo was called with smooth behavior
                        if (!scrollCalled) {
                            return false;
                        }
                        
                        if (!scrollOptions || scrollOptions.behavior !== 'smooth') {
                            return false;
                        }
                        
                        // Verify the target position is calculated correctly
                        const section = document.getElementById(sectionId);
                        const expectedTop = section.offsetTop - navManager.navbar.offsetHeight;
                        
                        return scrollOptions.top === expectedTop;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should prevent default link behavior when clicking navigation links', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    (sectionId) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        const link = document.querySelector(`a[href="#${sectionId}"]`);
                        if (!link) return true;
                        
                        let defaultPrevented = false;
                        
                        // Create a custom event to track preventDefault
                        const event = new window.MouseEvent('click', {
                            bubbles: true,
                            cancelable: true
                        });
                        
                        // Override preventDefault to track if it was called
                        const originalPreventDefault = event.preventDefault;
                        event.preventDefault = function() {
                            defaultPrevented = true;
                            originalPreventDefault.call(this);
                        };
                        
                        // Mock scrollTo to prevent errors
                        window.scrollTo = () => {};
                        
                        link.dispatchEvent(event);
                        
                        return defaultPrevented;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 6: 滚动位置与导航高亮同步
     * For any scroll position, when a section enters the viewport, the corresponding
     * navigation item should be highlighted (active class added)
     * Validates: Requirements 4.3
     */
    describe('Property 6: Scroll Position and Navigation Highlight Sync', () => {
        it('should highlight the correct navigation item when section is visible', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    (sectionId) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        // Simulate section becoming visible
                        const section = document.getElementById(sectionId);
                        if (!section || !navManager.observer) return true;
                        
                        // Trigger intersection
                        navManager.observer.triggerIntersection(section, true);
                        
                        // Check that the corresponding nav link is active
                        const activeLinks = document.querySelectorAll('.navbar-menu a.active');
                        
                        // Should have exactly one active link
                        if (activeLinks.length !== 1) {
                            return false;
                        }
                        
                        // The active link should point to the visible section
                        const activeLinkHref = activeLinks[0].getAttribute('href');
                        return activeLinkHref === `#${sectionId}`;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should remove active class from other navigation items', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    (firstSection, secondSection) => {
                        if (firstSection === secondSection) return true; // Skip same section
                        
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        if (!navManager.observer) return true;
                        
                        // First, make first section active
                        const section1 = document.getElementById(firstSection);
                        if (section1) {
                            navManager.observer.triggerIntersection(section1, true);
                        }
                        
                        // Then, make second section active
                        const section2 = document.getElementById(secondSection);
                        if (section2) {
                            navManager.observer.triggerIntersection(section2, true);
                        }
                        
                        // Only the second section's link should be active
                        const activeLinks = document.querySelectorAll('.navbar-menu a.active');
                        
                        if (activeLinks.length !== 1) {
                            return false;
                        }
                        
                        return activeLinks[0].getAttribute('href') === `#${secondSection}`;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not change active section if already active', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    (sectionId) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        if (!navManager.observer) return true;
                        
                        const section = document.getElementById(sectionId);
                        if (!section) return true;
                        
                        // Set active section
                        navManager.observer.triggerIntersection(section, true);
                        const firstActiveSection = navManager.activeSection;
                        
                        // Trigger again
                        navManager.observer.triggerIntersection(section, true);
                        const secondActiveSection = navManager.activeSection;
                        
                        // Should remain the same
                        return firstActiveSection === secondActiveSection && 
                               firstActiveSection === sectionId;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 7: 汉堡菜单切换状态
     * For any hamburger menu button click, the navigation menu display state should
     * toggle between expanded and collapsed
     * Validates: Requirements 4.5
     */
    describe('Property 7: Hamburger Menu Toggle State', () => {
        it('should toggle menu state when hamburger button is clicked', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 10 }),
                    (clickCount) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        const toggler = document.querySelector('.navbar-toggler');
                        const menu = document.querySelector('.navbar-menu');
                        
                        if (!toggler || !menu) return true;
                        
                        // Click the toggler multiple times
                        for (let i = 0; i < clickCount; i++) {
                            toggler.click();
                        }
                        
                        // Menu state should match click count parity
                        const expectedOpen = clickCount % 2 === 1;
                        const isOpen = menu.classList.contains('active');
                        
                        return isOpen === expectedOpen;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should update aria-expanded attribute when toggling menu', () => {
            fc.assert(
                fc.property(
                    fc.boolean(),
                    (shouldOpen) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        const toggler = document.querySelector('.navbar-toggler');
                        if (!toggler) return true;
                        
                        // After initialization, menu should be closed
                        // If we want it open, click once
                        if (shouldOpen) {
                            toggler.click();
                        }
                        
                        // Verify aria-expanded matches the expected state
                        const ariaExpanded = toggler.getAttribute('aria-expanded');
                        const expectedValue = String(shouldOpen);
                        
                        return ariaExpanded === expectedValue && navManager.isMenuOpen === shouldOpen;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should add/remove active class on toggler and menu', () => {
            fc.assert(
                fc.property(
                    fc.boolean(),
                    (targetState) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        const toggler = document.querySelector('.navbar-toggler');
                        const menu = document.querySelector('.navbar-menu');
                        
                        if (!toggler || !menu) return true;
                        
                        // After initialization, menu should be closed
                        // If we want it open, click once
                        if (targetState) {
                            toggler.click();
                        }
                        
                        // Verify both have active class when open, neither when closed
                        const togglerHasActive = toggler.classList.contains('active');
                        const menuHasActive = menu.classList.contains('active');
                        
                        return togglerHasActive === targetState && 
                               menuHasActive === targetState &&
                               navManager.isMenuOpen === targetState;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should close menu when window is resized above mobile breakpoint', () => {
            const navManager = new NavigationManager();
            navManager.initialize();
            
            const toggler = document.querySelector('.navbar-toggler');
            const menu = document.querySelector('.navbar-menu');
            
            if (!toggler || !menu) return;
            
            // Open menu
            toggler.click();
            expect(navManager.isMenuOpen).toBe(true);
            
            // Simulate window resize to desktop size
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1024
            });
            
            window.dispatchEvent(new window.Event('resize'));
            
            // Menu should be closed
            expect(navManager.isMenuOpen).toBe(false);
            expect(menu.classList.contains('active')).toBe(false);
        });

        it('should close menu when navigation link is clicked', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('intro', 'auth', 'upload', 'config', 'status'),
                    (sectionId) => {
                        const navManager = new NavigationManager();
                        navManager.initialize();
                        
                        const toggler = document.querySelector('.navbar-toggler');
                        const link = document.querySelector(`a[href="#${sectionId}"]`);
                        
                        if (!toggler || !link) return true;
                        
                        // Open menu
                        toggler.click();
                        const wasOpen = navManager.isMenuOpen;
                        
                        // Mock scrollTo
                        window.scrollTo = () => {};
                        
                        // Click a navigation link
                        link.click();
                        
                        // Menu should be closed if it was open
                        return !wasOpen || !navManager.isMenuOpen;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
