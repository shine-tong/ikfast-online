/**
 * Unit Tests for Error Handler
 * Tests error classification, display, and retry logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Window } from 'happy-dom';
import { ErrorDisplayComponent, GlobalErrorHandler } from '../web/error-handler.module.js';
import { NetworkError, GitHubAPIError, ValidationError } from '../web/github-api.module.js';

describe('ErrorDisplayComponent', () => {
    let window;
    let document;
    let errorDisplay;

    beforeEach(() => {
        window = new Window();
        document = window.document;
        document.body.innerHTML = '<div id="error-container"></div>';
        global.document = document;
        global.window = window;
        errorDisplay = new ErrorDisplayComponent();
    });

    afterEach(() => {
        delete global.document;
        delete global.window;
    });

    describe('showError', () => {
        it('should display error message', () => {
            const message = 'Test error message';
            errorDisplay.showError(message);

            const errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeTruthy();

            const messageElement = errorBanner.querySelector('.error-message');
            expect(messageElement.textContent).toBe(message);
        });

        it('should create error banner with proper ARIA attributes', () => {
            errorDisplay.showError('Test error');

            const errorBanner = document.querySelector('.error-banner');
            expect(errorBanner.getAttribute('role')).toBe('alert');
            expect(errorBanner.getAttribute('aria-live')).toBe('assertive');
        });

        it('should display close button', () => {
            errorDisplay.showError('Test error');

            const closeButton = document.querySelector('.error-close-button');
            expect(closeButton).toBeTruthy();
            expect(closeButton.getAttribute('aria-label')).toBe('Close error message');
        });

        it('should display retry button when retry option is true', () => {
            const retryFn = () => {};
            errorDisplay.showError('Test error', { retry: true, onRetry: retryFn });

            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeTruthy();
            expect(retryButton.textContent).toBe('重试');
        });

        it('should not display retry button when retry option is false', () => {
            errorDisplay.showError('Test error', { retry: false });

            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeFalsy();
        });

        it('should apply correct CSS class for error type', () => {
            errorDisplay.showError('Error', { type: 'error' });
            let errorBanner = document.querySelector('.error-banner');
            expect(errorBanner.classList.contains('error-error')).toBe(true);

            errorDisplay.clearAllErrors();

            errorDisplay.showError('Warning', { type: 'warning' });
            errorBanner = document.querySelector('.error-banner');
            expect(errorBanner.classList.contains('error-warning')).toBe(true);

            errorDisplay.clearAllErrors();

            errorDisplay.showError('Info', { type: 'info' });
            errorBanner = document.querySelector('.error-banner');
            expect(errorBanner.classList.contains('error-info')).toBe(true);
        });

        it('should invoke retry callback when retry button is clicked', () => {
            let retryCalled = false;
            const retryFn = () => { retryCalled = true; };

            errorDisplay.showError('Test error', { retry: true, onRetry: retryFn });

            const retryButton = document.querySelector('.error-retry-button');
            retryButton.click();

            expect(retryCalled).toBe(true);
        });

        it('should clear error when retry button is clicked', () => {
            const retryFn = () => {};
            errorDisplay.showError('Test error', { retry: true, onRetry: retryFn });

            let errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeTruthy();

            const retryButton = document.querySelector('.error-retry-button');
            retryButton.click();

            errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeFalsy();
        });
    });

    describe('clearError', () => {
        it('should remove specific error element', () => {
            const errorElement = errorDisplay.showError('Test error');
            expect(document.querySelector('.error-banner')).toBeTruthy();

            errorDisplay.clearError(errorElement);
            expect(document.querySelector('.error-banner')).toBeFalsy();
        });

        it('should handle null error element gracefully', () => {
            expect(() => errorDisplay.clearError(null)).not.toThrow();
        });
    });

    describe('clearAllErrors', () => {
        it('should remove all error elements', () => {
            errorDisplay.showError('Error 1');
            errorDisplay.showError('Error 2');
            errorDisplay.showError('Error 3');

            expect(document.querySelectorAll('.error-banner').length).toBe(3);

            errorDisplay.clearAllErrors();
            expect(document.querySelectorAll('.error-banner').length).toBe(0);
        });
    });

    describe('highlightField', () => {
        it('should add error class to field', () => {
            const input = document.createElement('input');
            input.id = 'test-field';
            document.body.appendChild(input);

            errorDisplay.highlightField('test-field');

            expect(input.classList.contains('error-field')).toBe(true);
            expect(input.getAttribute('aria-invalid')).toBe('true');
        });

        it('should remove highlight on input event', () => {
            const input = document.createElement('input');
            input.id = 'test-field';
            document.body.appendChild(input);

            errorDisplay.highlightField('test-field');
            expect(input.classList.contains('error-field')).toBe(true);

            input.dispatchEvent(new window.Event('input'));
            expect(input.classList.contains('error-field')).toBe(false);
            expect(input.hasAttribute('aria-invalid')).toBe(false);
        });

        it('should handle non-existent field gracefully', () => {
            expect(() => errorDisplay.highlightField('non-existent')).not.toThrow();
        });
    });
});

describe('GlobalErrorHandler', () => {
    let window;
    let document;
    let errorDisplay;
    let errorHandler;

    beforeEach(() => {
        window = new Window();
        document = window.document;
        document.body.innerHTML = '<div id="error-container"></div>';
        global.document = document;
        global.window = window;
        errorDisplay = new ErrorDisplayComponent();
        errorHandler = new GlobalErrorHandler(errorDisplay);
    });

    afterEach(() => {
        delete global.document;
        delete global.window;
    });

    describe('handleValidationError', () => {
        it('should display validation error message', () => {
            const error = new ValidationError('Invalid input', 'test-field', 'bad-value');
            errorHandler.handleValidationError(error);

            const errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeTruthy();
            expect(errorBanner.querySelector('.error-message').textContent).toBe('Invalid input');
        });

        it('should highlight field if field is specified', () => {
            const input = document.createElement('input');
            input.id = 'test-field';
            document.body.appendChild(input);

            const error = new ValidationError('Invalid input', 'test-field', 'bad-value');
            errorHandler.handleValidationError(error);

            expect(input.classList.contains('error-field')).toBe(true);
        });

        it('should not throw if field does not exist', () => {
            const error = new ValidationError('Invalid input', 'non-existent', 'bad-value');
            expect(() => errorHandler.handleValidationError(error)).not.toThrow();
        });
    });

    describe('handleNetworkError', () => {
        it('should display network error message', () => {
            const error = new NetworkError('Connection failed', 500, null);
            errorHandler.handleNetworkError(error, 'test-operation', null);

            const errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeTruthy();
            expect(errorBanner.querySelector('.error-message').textContent).toContain('网络连接失败');
            expect(errorBanner.querySelector('.error-message').textContent).toContain('Connection failed');
        });

        it('should display retry button when retry function is provided', () => {
            const error = new NetworkError('Connection failed', 500, null);
            const retryFn = () => Promise.resolve();
            errorHandler.handleNetworkError(error, 'test-operation', retryFn);

            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeTruthy();
        });

        it('should not display retry button when retry function is not provided', () => {
            const error = new NetworkError('Connection failed', 500, null);
            errorHandler.handleNetworkError(error, 'test-operation', null);

            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeFalsy();
        });

        it('should track retry attempts', async () => {
            const error = new NetworkError('Connection failed', 500, null);
            let retryCount = 0;
            const retryFn = () => {
                retryCount++;
                return Promise.resolve();
            };

            errorHandler.handleNetworkError(error, 'test-operation', retryFn);

            const retryButton = document.querySelector('.error-retry-button');
            retryButton.click();

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(retryCount).toBe(1);
        });
    });

    describe('handleAPIError', () => {
        it('should display API error message with status code', async () => {
            const error = new GitHubAPIError('API failed', 404, 'Not found');
            await errorHandler.handleAPIError(error, 'test-operation', null);

            const errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeTruthy();
            const message = errorBanner.querySelector('.error-message').textContent;
            expect(message).toContain('GitHub API 错误');
            expect(message).toContain('404');
        });

        it('should provide specific guidance for 401 errors', async () => {
            const error = new GitHubAPIError('Unauthorized', 401, 'Bad credentials');
            await errorHandler.handleAPIError(error, 'test-operation', null);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('认证失败');
            expect(message).toContain('Token');
        });

        it('should provide specific guidance for 403 errors', async () => {
            const error = new GitHubAPIError('Forbidden', 403, 'Insufficient permissions');
            await errorHandler.handleAPIError(error, 'test-operation', null);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('权限不足');
        });

        it('should provide specific guidance for 404 errors', async () => {
            const error = new GitHubAPIError('Not found', 404, 'Resource not found');
            await errorHandler.handleAPIError(error, 'test-operation', null);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('资源未找到');
        });

        it('should provide specific guidance for 422 errors', async () => {
            const error = new GitHubAPIError('Unprocessable', 422, 'Validation failed');
            await errorHandler.handleAPIError(error, 'test-operation', null);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('请求参数无效');
        });

        it('should provide specific guidance for 5xx errors', async () => {
            const error = new GitHubAPIError('Server error', 500, 'Internal server error');
            await errorHandler.handleAPIError(error, 'test-operation', null);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('GitHub 服务暂时不可用');
        });

        it('should display retry button for rate limit errors', async () => {
            const error = new GitHubAPIError('Rate limited', 403, 'rate limit exceeded');
            const retryFn = () => Promise.resolve();
            await errorHandler.handleAPIError(error, 'test-operation', retryFn);

            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeTruthy();
        });

        it('should display retry button for server errors', async () => {
            const error = new GitHubAPIError('Server error', 500, 'Internal error');
            const retryFn = () => Promise.resolve();
            await errorHandler.handleAPIError(error, 'test-operation', retryFn);

            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeTruthy();
        });
    });

    describe('handleUnknownError', () => {
        it('should display unknown error message', () => {
            const error = new Error('Something went wrong');
            errorHandler.handleUnknownError(error);

            const errorBanner = document.querySelector('.error-banner');
            expect(errorBanner).toBeTruthy();
            const message = errorBanner.querySelector('.error-message').textContent;
            expect(message).toContain('发生未知错误');
            expect(message).toContain('Something went wrong');
        });
    });

    describe('handleError', () => {
        it('should route ValidationError to handleValidationError', async () => {
            const error = new ValidationError('Invalid', 'field', 'value');
            await errorHandler.handleError(error);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toBe('Invalid');
        });

        it('should route NetworkError to handleNetworkError', async () => {
            const error = new NetworkError('Network failed', 500, null);
            await errorHandler.handleError(error, { operation: 'test' });

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('网络连接失败');
        });

        it('should route GitHubAPIError to handleAPIError', async () => {
            const error = new GitHubAPIError('API failed', 404, 'Not found');
            await errorHandler.handleError(error, { operation: 'test' });

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('GitHub API 错误');
        });

        it('should route unknown errors to handleUnknownError', async () => {
            const error = new Error('Unknown error');
            await errorHandler.handleError(error);

            const message = document.querySelector('.error-message').textContent;
            expect(message).toContain('发生未知错误');
        });
    });

    describe('retry logic', () => {
        it('should reset retry attempts after successful retry', async () => {
            const error = new NetworkError('Connection failed', 500, null);
            const retryFn = () => Promise.resolve();

            errorHandler.handleNetworkError(error, 'test-operation', retryFn);
            
            const retryButton = document.querySelector('.error-retry-button');
            retryButton.click();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(errorHandler.retryAttempts.has('test-operation')).toBe(false);
        });

        it('should clear all retry attempts', () => {
            errorHandler.retryAttempts.set('op1', 1);
            errorHandler.retryAttempts.set('op2', 2);

            errorHandler.clearAllRetries();

            expect(errorHandler.retryAttempts.size).toBe(0);
        });

        it('should reset specific operation retries', () => {
            errorHandler.retryAttempts.set('op1', 1);
            errorHandler.retryAttempts.set('op2', 2);

            errorHandler.resetRetries('op1');

            expect(errorHandler.retryAttempts.has('op1')).toBe(false);
            expect(errorHandler.retryAttempts.has('op2')).toBe(true);
        });
    });
});
