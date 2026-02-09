/**
 * QuotaWarningComponent - Displays GitHub Actions quota warnings
 * ES Module version for testing
 */

class QuotaWarningComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.elements = null;
        this.checkInterval = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the quota warning UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Hide warning initially
        if (this.elements.warningContainer) {
            this.elements.warningContainer.style.display = 'none';
        }
        
        // Set up dismiss button
        if (this.elements.dismissButton) {
            this.elements.dismissButton.addEventListener('click', () => this.dismissWarning());
        }
    }
    
    /**
     * Check quota and display warning if needed
     * @returns {Promise<boolean>} True if warning was displayed
     */
    async checkAndDisplayWarning() {
        try {
            const quotaInfo = await this.githubAPIClient.checkQuotaWarning();
            
            if (!quotaInfo) {
                // Can't check quota (no permission)
                return false;
            }
            
            if (quotaInfo.shouldWarn) {
                this.displayWarning(quotaInfo);
                return true;
            } else {
                this.hideWarning();
                return false;
            }
        } catch (error) {
            console.error('Error checking quota:', error);
            return false;
        }
    }
    
    /**
     * Display quota warning
     * @param {Object} quotaInfo - Quota information
     */
    displayWarning(quotaInfo) {
        if (!this.elements || !this.elements.warningContainer) {
            console.warn('Quota warning:', quotaInfo.message);
            return;
        }
        
        // Set warning message
        if (this.elements.warningMessage) {
            this.elements.warningMessage.textContent = quotaInfo.message;
        }
        
        // Show warning container
        this.elements.warningContainer.style.display = 'block';
        this.elements.warningContainer.className = 'quota-warning warning';
        
        // Add additional details if available
        if (this.elements.warningDetails) {
            const percentText = Math.round(quotaInfo.percentUsed * 100);
            this.elements.warningDetails.textContent = 
                `Used ? ${quotaInfo.totalMinutesUsed} / ${quotaInfo.includedMinutes} minutes (${percentText}%)`;
        }
    }
    
    /**
     * Hide quota warning
     */
    hideWarning() {
        if (this.elements && this.elements.warningContainer) {
            this.elements.warningContainer.style.display = 'none';
        }
    }
    
    /**
     * Dismiss warning (user action)
     */
    dismissWarning() {
        this.hideWarning();
        
        // Store dismissal in session storage to avoid showing again this session
        sessionStorage.setItem('quotaWarningDismissed', 'true');
    }
    
    /**
     * Check if warning was dismissed this session
     * @returns {boolean}
     */
    wasWarningDismissed() {
        return sessionStorage.getItem('quotaWarningDismissed') === 'true';
    }
    
    /**
     * Start periodic quota checking
     * @param {number} interval - Check interval in milliseconds (default: 5 minutes)
     */
    startPeriodicCheck(interval = 300000) {
        // Don't check if already dismissed
        if (this.wasWarningDismissed()) {
            return;
        }
        
        // Initial check
        this.checkAndDisplayWarning();
        
        // Set up periodic checking
        this.checkInterval = setInterval(() => {
            if (!this.wasWarningDismissed()) {
                this.checkAndDisplayWarning();
            } else {
                this.stopPeriodicCheck();
            }
        }, interval);
    }
    
    /**
     * Stop periodic quota checking
     */
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    /**
     * Reset dismissal state (for testing)
     */
    resetDismissal() {
        sessionStorage.removeItem('quotaWarningDismissed');
    }
}
