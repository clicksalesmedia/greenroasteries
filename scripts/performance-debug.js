// Performance Debug Script for Green Roasteries
// This script identifies and fixes layout shift issues in real-time

const performanceOptimizations = {
  // Prevent layout shifts by reserving space for images
  preventLayoutShifts() {
    // Add styles to ensure images have reserved space
    const style = document.createElement('style');
    style.textContent = `
      .product-image-wrapper,
      .category-image-wrapper {
        aspect-ratio: 1 !important;
        min-height: 200px !important;
        background-color: #f3f4f6 !important;
      }
      
      .section.bg-gray-50 {
        min-height: 700px !important;
      }
      
      .grid.grid-cols-2 {
        min-height: 600px !important;
      }
      
      /* Prevent navbar logo from causing shifts */
      .h-16.w-auto {
        width: 64px !important;
        height: 64px !important;
      }
    `;
    document.head.appendChild(style);
  },

  // Optimize image loading
  optimizeImages() {
    const images = document.querySelectorAll('img[data-nimg="fill"]');
    images.forEach(img => {
      // Add loading state
      if (!img.complete) {
        img.parentElement.style.backgroundColor = '#f3f4f6';
        img.parentElement.style.minHeight = '200px';
      }
      
      // Handle image load
      img.addEventListener('load', function() {
        this.parentElement.style.backgroundColor = 'transparent';
      });
      
      // Handle image error
      img.addEventListener('error', function() {
        this.style.display = 'none';
        this.parentElement.style.backgroundColor = '#f3f4f6';
      });
    });
  },

  // Monitor layout shifts
  monitorLayoutShifts() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Layout Shift detected:', entry.value, entry.hadRecentInput);
          if (entry.value > 0.1) {
            console.warn('Significant layout shift detected!', entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  },

  // Initialize all optimizations
  init() {
    // Apply immediately
    this.preventLayoutShifts();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.optimizeImages();
        this.monitorLayoutShifts();
      });
    } else {
      this.optimizeImages();
      this.monitorLayoutShifts();
    }
  }
};

// Auto-initialize
performanceOptimizations.init();

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = performanceOptimizations;
} else if (typeof window !== 'undefined') {
  window.performanceOptimizations = performanceOptimizations;
} 