/**
 * GlobalErrorHandler - Handles all errors with retry logic
 */

class GlobalErrorHandler {
    constructor() {
        this.retryCallbacks = new Map();
    }
    
    /**
     * Handle an error
     * @param {Error} error - The error to handle
     * @param {Object} context - Error context
     */
    async handleError(error, context = {}) {
        console.error('Error:', error);
        
        const errorMessage = this.getErrorMessage(error);
        
        // Display error to user
        this.displayError(errorMessage, context);
        
        // Store retry callback if provided
        if (context.retry && context.operation) {
            this.retryCallbacks.set(context.operation, context.retry);
        }
    }
    
    /**
     * Get user-friendly error message
     * @param {Error} error - The error
     * @returns {string} Error message
     */
    getErrorMessage(error) {
        if (error.message) {
            return error.message;
        }
        return 'An unknown error occurred';
    }
    
    /**
     * Display error to user
     * @param {string} message - Error message
     * @param {Object} context - Error context
     */
    displayError(message, context) {
        const errorSection = document.getElementById('error-section');
        const errorText = document.getElementById('error-text');
        
        if (errorSection && errorText) {
            errorText.textContent = message;
            errorSection.style.display = 'block';
            errorSection.className = 'error-section error';
        }
    }
    
    /**
     * Retry a failed operation
     * @param {string} operation - Operation identifier
     */
    async retry(operation) {
        const callback = this.retryCallbacks.get(operation);
        if (callback) {
            try {
                await callback();
                this.retryCallbacks.delete(operation);
            } catch (error) {
                this.handleError(error, { operation });
            }
        }
    }
}
