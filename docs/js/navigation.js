/**
 * NavigationManager - Manages page navigation functionality
 * 
 * Features:
 * - Smooth scroll to specified sections
 * - Scroll monitoring and navigation highlighting
 * - Mobile menu toggle
 * - Responsive navigation behavior
 * 
 * Performance optimization:
 * - Use event delegation to reduce number of listeners
 * - Debounce window resize events
 */
class NavigationManager {
  constructor() {
    this.navbar = null;
    this.navLinks = [];
    this.sections = [];
    this.activeSection = null;
    this.isMenuOpen = false;
    this.observer = null;
    this.resizeTimeout = null;
  }
  
  /**
   * Debounce function - delays execution until calls stop for a period
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time (milliseconds)
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  /**
   * Initialize navigation component
   */
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
    
    console.log('NavigationManager initialized');
  }
  
  /**
   * Setup event listeners
   * Use event delegation to optimize performance
   */
  setupEventListeners() {
    // Use event delegation to handle navigation link clicks
    const menu = document.querySelector('.navbar-menu');
    if (menu) {
      menu.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').startsWith('#')) {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          this.scrollToSection(targetId);
          if (this.isMenuOpen) {
            this.toggleMenu();
          }
        }
      });
    }
    
    // Mobile menu toggle
    const toggler = document.querySelector('.navbar-toggler');
    if (toggler) {
      toggler.addEventListener('click', () => this.toggleMenu());
    }
    
    // Close mobile menu on window resize (with debounce)
    const debouncedResize = this.debounce(() => {
      if (window.innerWidth > 768 && this.isMenuOpen) {
        this.toggleMenu();
      }
    }, 250);
    
    window.addEventListener('resize', debouncedResize, { passive: true });
  }
  
  /**
   * Smooth scroll to specified sections
   * @param {string} sectionId - Target section ID
   */
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
  
  /**
   * Toggle mobile menu
   */
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
  
  /**
   * Setup scroll monitoring, highlight current section
   */
  setupScrollSpy() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, using fallback');
      this.setupScrollSpyFallback();
      return;
    }
    
    const observerOptions = {
      rootMargin: `-${this.navbar.offsetHeight}px 0px -80% 0px`,
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
  
  /**
   * Scroll monitoring fallback (used when IntersectionObserver is not supported)
   * Use debounce to optimize performance
   */
  setupScrollSpyFallback() {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateActiveSectionFallback();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  /**
   * Update active section (fallback)
   */
  updateActiveSectionFallback() {
    const scrollPosition = window.scrollY + this.navbar.offsetHeight + 100;
    
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      if (section && section.offsetTop <= scrollPosition) {
        this.setActiveSection(section.id);
        break;
      }
    }
  }
  
  /**
   * Set active section
   * @param {string} sectionId - Section ID
   */
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
  
  /**
   * Destroy navigation manager
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
}

// Export as global variable for use by other scripts
if (typeof window !== 'undefined') {
  window.NavigationManager = NavigationManager;
}
