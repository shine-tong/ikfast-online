/**
 * NavigationManager - 管理页面导航功能
 * 
 * 功能：
 * - 平滑滚动到指定区域
 * - 滚动监听和导航高亮
 * - 移动端菜单切换
 * - 响应式导航行为
 * 
 * 性能优化：
 * - 使用事件委托减少监听器数量
 * - 防抖处理窗口调整大小事件
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
   * 防抖函数 - 延迟执行函数直到停止调用一段时间后
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  /**
   * 初始化导航组件
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
   * 设置事件监听器
   * 使用事件委托优化性能
   */
  setupEventListeners() {
    // 使用事件委托处理导航链接点击
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
    
    // 移动端菜单切换
    const toggler = document.querySelector('.navbar-toggler');
    if (toggler) {
      toggler.addEventListener('click', () => this.toggleMenu());
    }
    
    // 窗口调整大小时关闭移动菜单（使用防抖）
    const debouncedResize = this.debounce(() => {
      if (window.innerWidth > 768 && this.isMenuOpen) {
        this.toggleMenu();
      }
    }, 250);
    
    window.addEventListener('resize', debouncedResize, { passive: true });
  }
  
  /**
   * 平滑滚动到指定区域
   * @param {string} sectionId - 目标区域的 ID
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
   * 切换移动端菜单
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
   * 设置滚动监听，高亮当前区域
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
   * 滚动监听后备方案（不支持 IntersectionObserver 时使用）
   * 使用防抖优化性能
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
   * 更新活动区域（后备方案）
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
   * 设置活动区域
   * @param {string} sectionId - 区域 ID
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
   * 销毁导航管理器
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

// 导出为全局变量以便其他脚本使用
if (typeof window !== 'undefined') {
  window.NavigationManager = NavigationManager;
}
