/**
 * Error Handler
 * Provides global error handling, error display, and retry logic
 * Non-module version for direct browser usage
 */

/**
 * ErrorDisplayComponent - Displays errors to users with appropriate styling
 */
class ErrorDisplayComponent {
    constructor(containerId = 'error-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            // Create container if it doesn't exist
            this.container = document.createElement('div');
            this.container.id = containerId;
            this.container.className = 'error-container';
            document.body.insertBefore(this.container, document.body.firstChild);
        }
    }

    /**
     * Display an error message
     * @param {string} message - Error message to display
     * @param {Object} options - Display options
     * @param {boolean} options.retry - Show retry button
     * @param {Function} options.onRetry - Retry callback function
     * @param {string} options.type - Error type (error, warning, info)
     */
    showError(message, options = {}) {
        const {
            retry = false,
            onRetry = null,
            type = 'error'
        } = options;

        const errorElement = document.createElement('div');
        errorElement.className = `error-banner error-${type}`;
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'assertive');

        const messageElement = document.createElement('div');
        messageElement.className = 'error-message';
        messageElement.textContent = message;
        errorElement.appendChild(messageElement);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'error-buttons';

        if (retry && onRetry) {
            const retryButton = document.createElement('button');
            retryButton.className = 'error-retry-button';
            retryButton.textContent = '重试';
            retryButton.onclick = () => {
                this.clearError(errorElement);
                onRetry();
            };
            buttonContainer.appendChild(retryButton);
        }

        const closeButton = document.createElement('button');
        closeButton.className = 'error-close-button';
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', 'Close error message');
        closeButton.onclick = () => this.clearError(errorElement);
        buttonContainer.appendChild(closeButton);

        errorElement.appendChild(buttonContainer);
        this.container.appendChild(errorElement);

        return errorElement;
    }

    /**
     * Clear a specific error element
     * @param {HTMLElement} errorElement - Error element to remove
     */
    clearError(errorElement) {
        if (errorElement && errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }

    /**
     * Clear all errors
     */
    clearAllErrors() {
        this.container.innerHTML = '';
    }

    /**
     * Highlight an invalid field
     * @param {string} fieldId - ID of the field to highlight
     */
    highlightField(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error-field');
            field.setAttribute('aria-invalid', 'true');
            
            // Remove highlight after user interacts
            const removeHighlight = () => {
                field.classList.remove('error-field');
                field.removeAttribute('aria-invalid');
                field.removeEventListener('input', removeHighlight);
                field.removeEventListener('change', removeHighlight);
            };
            
            field.addEventListener('input', removeHighlight);
            field.addEventListener('change', removeHighlight);
        }
    }
}

/**
 * GlobalErrorHandler - Handles all errors with retry logic and appropriate display
 */
class GlobalErrorHandler {
    constructor(errorDisplay) {
        this.errorDisplay = errorDisplay || new ErrorDisplayComponent();
        this.retryAttempts = new Map(); // Track retry attempts per operation
        this.maxRetries = 3;
        this.retryDelay = 1000; // Initial delay in ms
    }

    /**
     * Handle an error with appropriate strategy
     * @param {Error} error - Error to handle
     * @param {Object} context - Context information
     * @param {string} context.operation - Operation that failed
     * @param {Function} context.retry - Function to retry the operation
     */
    async handleError(error, context = {}) {
        const { operation = 'operation', retry = null } = context;

        if (error.name === 'ValidationError') {
            return this.handleValidationError(error);
        } else if (error.name === 'NetworkError') {
            return this.handleNetworkError(error, operation, retry);
        } else if (error.name === 'GitHubAPIError') {
            return this.handleAPIError(error, operation, retry);
        } else {
            return this.handleUnknownError(error);
        }
    }

    /**
     * Handle validation errors
     * @param {ValidationError} error - Validation error
     */
    handleValidationError(error) {
        this.errorDisplay.showError(error.message, { type: 'warning' });
        
        if (error.field) {
            this.errorDisplay.highlightField(error.field);
        }
    }

    /**
     * Handle network errors with retry logic
     * @param {NetworkError} error - Network error
     * @param {string} operation - Operation name
     * @param {Function} retry - Retry function
     */
    async handleNetworkError(error, operation, retry) {
        const message = `网络连接失败: ${error.message}`;
        
        if (retry) {
            const attempts = this.retryAttempts.get(operation) || 0;
            
            if (attempts < this.maxRetries) {
                // Show error with retry button
                this.errorDisplay.showError(
                    `${message} (尝试 ${attempts + 1}/${this.maxRetries})`,
                    {
                        retry: true,
                        onRetry: async () => {
                            this.retryAttempts.set(operation, attempts + 1);
                            
                            // Exponential backoff
                            const delay = this.retryDelay * Math.pow(2, attempts);
                            await this.sleep(delay);
                            
                            try {
                                await retry();
                                this.retryAttempts.delete(operation);
                            } catch (retryError) {
                                await this.handleError(retryError, { operation, retry });
                            }
                        }
                    }
                );
            } else {
                // Max retries reached
                this.errorDisplay.showError(
                    `${message}\n已达到最大重试次数，请检查网络连接后手动重试。`
                );
                this.retryAttempts.delete(operation);
            }
        } else {
            // No retry function provided
            this.errorDisplay.showError(message);
        }
    }

    /**
     * Handle GitHub API errors
     * @param {GitHubAPIError} error - API error
     * @param {string} operation - Operation name
     * @param {Function} retry - Retry function
     */
    async handleAPIError(error, operation, retry) {
        let message = `GitHub API 错误 (${error.statusCode}): ${error.apiMessage || error.message}`;
        let showRetry = false;

        // Provide specific guidance based on status code
        switch (error.statusCode) {
            case 401:
                message += '\n\n认证失败，请检查 Token 是否有效。';
                break;
            case 403:
                if (error.apiMessage && error.apiMessage.includes('rate limit')) {
                    message += '\n\nAPI 速率限制已达到，请稍后再试。';
                    showRetry = true;
                } else {
                    message += '\n\n权限不足，请确保 Token 具有 repo 和 workflow 权限。';
                }
                break;
            case 404:
                message += '\n\n资源未找到，请检查仓库配置是否正确。';
                break;
            case 422:
                message += '\n\n请求参数无效，请检查输入数据。';
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                message += '\n\nGitHub 服务暂时不可用，请稍后重试。';
                showRetry = true;
                break;
            default:
                showRetry = true;
        }

        if (showRetry && retry) {
            this.errorDisplay.showError(message, {
                retry: true,
                onRetry: async () => {
                    try {
                        await retry();
                    } catch (retryError) {
                        await this.handleError(retryError, { operation, retry });
                    }
                }
            });
        } else {
            this.errorDisplay.showError(message);
        }
    }

    /**
     * Handle unknown errors
     * @param {Error} error - Unknown error
     */
    handleUnknownError(error) {
        console.error('Unexpected error:', error);
        this.errorDisplay.showError(
            `发生未知错误: ${error.message}\n请查看浏览器控制台获取详细信息。`
        );
    }

    /**
     * Sleep utility for retry delays
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset retry attempts for an operation
     * @param {string} operation - Operation name
     */
    resetRetries(operation) {
        this.retryAttempts.delete(operation);
    }

    /**
     * Clear all retry attempts
     */
    clearAllRetries() {
        this.retryAttempts.clear();
    }
}

/**
 * Convenience function to handle operations with error handling
 * @param {Function} operation - Async operation to execute
 * @param {Object} context - Error handling context
 * @returns {Promise} Operation result
 */
async function handleOperation(operation, context = {}) {
    const errorHandler = context.errorHandler || new GlobalErrorHandler();
    
    try {
        return await operation();
    } catch (error) {
        await errorHandler.handleError(error, {
            operation: context.operationName || 'operation',
            retry: context.retry || null
        });
        throw error; // Re-throw for caller to handle if needed
    }
}
