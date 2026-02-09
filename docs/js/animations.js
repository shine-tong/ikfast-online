/**
 * AnimationManager - Manages page animation effects
 * 
 * Handles scroll-triggered animations, hover effects, page load animations, etc.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * Performance optimization:
 * - Use event delegation to handle hover effects
 * - 支持 prefers-reduced-motion
 */
class AnimationManager {
  constructor() {
    this.observers = [];
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Initialize animation system
   */
  initialize() {
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupLoadingAnimations();
  }
  
  /**
   * Setup scroll-triggered animations
   * Requirements: 7.2
   * Skip if user prefers reduced motion
   */
  setupScrollAnimations() {
    if (this.prefersReducedMotion) {
      // 直接添加类而不播放动画
      const animatedElements = document.querySelectorAll('[data-animate]');
      animatedElements.forEach(el => {
        el.classList.add('animated', el.dataset.animate);
      });
      return;
    }
    
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const animationType = entry.target.dataset.animate;
            entry.target.classList.add('animated', animationType);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    animatedElements.forEach(el => observer.observe(el));
    this.observers.push(observer);
  }
  
  /**
   * Setup hover effects
   * Requirements: 7.1, 7.3
   * Use event delegation to optimize performance
   */
  setupHoverEffects() {
    if (this.prefersReducedMotion) {
      return; // 跳过悬停动画
    }
    
    // 使用事件委托处理所有卡片的悬停效果
    document.body.addEventListener('mouseenter', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        card.style.transform = 'translateY(-8px)';
      }
    }, true);
    
    document.body.addEventListener('mouseleave', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        card.style.transform = 'translateY(0)';
      }
    }, true);
  }
  
  /**
   * Setup page load animations
   * Requirements: 7.2
   */
  setupLoadingAnimations() {
    window.addEventListener('load', () => {
      document.body.classList.add('loaded');
    });
  }
  
  /**
   * 添加淡入动画
   * Requirements: 7.4
   */
  fadeIn(element, duration = 300) {
    if (this.prefersReducedMotion) {
      element.style.opacity = '1';
      element.style.display = 'block';
      return;
    }
    
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * 添加淡出动画
   * Requirements: 7.4
   */
  fadeOut(element, duration = 300) {
    if (this.prefersReducedMotion) {
      element.style.opacity = '0';
      element.style.display = 'none';
      return;
    }
    
    let start = null;
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(initialOpacity - (progress / duration), 0);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * 销毁动画管理器
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 导出为模块（如果支持）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationManager;
}
