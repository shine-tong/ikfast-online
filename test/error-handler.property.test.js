/**
 * Property-Based Tests for Error Handler
 * Tests universal properties of error handling and display
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { Window } from 'happy-dom';
import { ErrorDisplayComponent, GlobalErrorHandler } from '../web/error-handler.module.js';
import { NetworkError, GitHubAPIError, ValidationError } from '../web/github-api.module.js';

describe('Error Handler - Property-Based Tests', () => {
    let window;
    let document;

    beforeEach(() => {
        window = new Window();
        document = window.document;
        document.body.innerHTML = '<div id="error-container"></div>';
        global.document = document;
        global.window = window;
    });

    afterEach(() => {
        delete global.document;
        delete global.window;
    });

    /**
     * Property 6: Error Message Display
     * For any failed operation (API error, network error, validation error),
     * the system should display an error message containing relevant error details to the user
     * Validates: Requirements 1.4, 2.5, 7.5, 8.5, 9.1, 9.2, 9.3, 9.4
     */
    describe('Property 6: Error Message Display', () => {
        it('should display error message for any ValidationError', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.option(fc.string(), { nil: null }),
                    fc.anything(),
                    (message, field, value) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new ValidationError(message, field, value);
                        const handler = new GlobalErrorHandler(errorDisplay);

                        handler.handleValidationError(error);

                        const errorBanners = document.querySelectorAll('.error-banner');
                        expect(errorBanners.length).toBeGreaterThan(0);

                        const displayedMessage = errorBanners[0].querySelector('.error-message').textContent;
                        // ValidationError displays message as-is
                        expect(displayedMessage).toBe(message);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should display error message for any NetworkError', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 400, max: 599 }),
                    fc.option(fc.string(), { nil: null }),
                    (message, statusCode, response) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new NetworkError(message, statusCode, response);
                        const handler = new GlobalErrorHandler(errorDisplay);

                        handler.handleNetworkError(error, 'test-operation', null);

                        const errorBanners = document.querySelectorAll('.error-banner');
                        expect(errorBanners.length).toBeGreaterThan(0);

                        const displayedMessage = errorBanners[0].querySelector('.error-message').textContent;
                        // NetworkError prefixes with "网络连接失败: "
                        expect(displayedMessage).toContain('网络连接失败');
                        expect(displayedMessage).toContain(message);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should display error message for any GitHubAPIError', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    fc.constantFrom(401, 403, 404, 422, 500, 502, 503, 504),
                    fc.option(fc.string(), { nil: null }),
                    async (message, statusCode, apiMessage) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new GitHubAPIError(message, statusCode, apiMessage);
                        const handler = new GlobalErrorHandler(errorDisplay);

                        await handler.handleAPIError(error, 'test-operation', null);

                        const errorBanners = document.querySelectorAll('.error-banner');
                        expect(errorBanners.length).toBeGreaterThan(0);

                        const displayedMessage = errorBanners[0].querySelector('.error-message').textContent;
                        // GitHubAPIError formats as "GitHub API 错误 (statusCode): ..."
                        expect(displayedMessage).toContain('GitHub API 错误');
                        expect(displayedMessage).toContain(statusCode.toString());

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should display error message for any unknown error', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    (message) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new Error(message);
                        const handler = new GlobalErrorHandler(errorDisplay);

                        handler.handleUnknownError(error);

                        const errorBanners = document.querySelectorAll('.error-banner');
                        expect(errorBanners.length).toBeGreaterThan(0);

                        const displayedMessage = errorBanners[0].querySelector('.error-message').textContent;
                        // Unknown errors are prefixed with "发生未知错误: "
                        expect(displayedMessage).toContain('发生未知错误');
                        expect(displayedMessage).toContain(message);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should preserve error details in displayed message', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 400, max: 599 }),
                    fc.string({ minLength: 1 }),
                    async (message, statusCode, apiMessage) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new GitHubAPIError(message, statusCode, apiMessage);
                        const handler = new GlobalErrorHandler(errorDisplay);

                        await handler.handleAPIError(error, 'test-operation', null);

                        const errorBanners = document.querySelectorAll('.error-banner');
                        const displayedMessage = errorBanners[0].querySelector('.error-message').textContent;

                        // Should contain status code
                        expect(displayedMessage).toContain(statusCode.toString());

                        // Should contain either the message or apiMessage
                        const containsRelevantInfo = 
                            displayedMessage.includes(message) || 
                            displayedMessage.includes(apiMessage);
                        expect(containsRelevantInfo).toBe(true);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should create error banner with proper ARIA attributes', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    (message) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        errorDisplay.showError(message);

                        const errorBanner = document.querySelector('.error-banner');
                        expect(errorBanner).toBeTruthy();
                        expect(errorBanner.getAttribute('role')).toBe('alert');
                        expect(errorBanner.getAttribute('aria-live')).toBe('assertive');

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should display close button for any error', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    (message) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        errorDisplay.showError(message);

                        const closeButton = document.querySelector('.error-close-button');
                        expect(closeButton).toBeTruthy();
                        expect(closeButton.getAttribute('aria-label')).toBe('Close error message');

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 28: Retry Option for Network Errors
     * For any network error encountered, the system should provide a retry button or option to the user
     * Validates: Requirements 9.4
     */
    describe('Property 28: Retry Option for Network Errors', () => {
        it('should display retry button for any NetworkError with retry function', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 400, max: 599 }),
                    (message, statusCode) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new NetworkError(message, statusCode, null);
                        const handler = new GlobalErrorHandler(errorDisplay);
                        const retryFn = () => Promise.resolve();

                        handler.handleNetworkError(error, 'test-operation', retryFn);

                        // Query immediately - showError is synchronous
                        const retryButton = document.querySelector('.error-retry-button');
                        expect(retryButton).toBeTruthy();
                        expect(retryButton.textContent).toBe('重试');

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not display retry button for NetworkError without retry function', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 400, max: 599 }),
                    (message, statusCode) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new NetworkError(message, statusCode, null);
                        const handler = new GlobalErrorHandler(errorDisplay);

                        handler.handleNetworkError(error, 'test-operation', null);

                        const retryButton = document.querySelector('.error-retry-button');
                        expect(retryButton).toBeFalsy();

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should display retry button for server errors (5xx) with retry function', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    fc.constantFrom(500, 502, 503, 504),
                    fc.option(fc.string(), { nil: null }),
                    async (message, statusCode, apiMessage) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new GitHubAPIError(message, statusCode, apiMessage);
                        const handler = new GlobalErrorHandler(errorDisplay);
                        const retryFn = () => Promise.resolve();

                        await handler.handleAPIError(error, 'test-operation', retryFn);

                        const retryButton = document.querySelector('.error-retry-button');
                        expect(retryButton).toBeTruthy();

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should display retry button for rate limit errors (403) with retry function', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    async (message) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new GitHubAPIError(message, 403, 'rate limit exceeded');
                        const handler = new GlobalErrorHandler(errorDisplay);
                        const retryFn = () => Promise.resolve();

                        await handler.handleAPIError(error, 'test-operation', retryFn);

                        const retryButton = document.querySelector('.error-retry-button');
                        expect(retryButton).toBeTruthy();

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should invoke retry callback when retry button is clicked', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 400, max: 599 }),
                    async (message, statusCode) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new NetworkError(message, statusCode, null);
                        const handler = new GlobalErrorHandler(errorDisplay);
                        
                        let retryCalled = false;
                        const retryFn = () => {
                            retryCalled = true;
                            return Promise.resolve();
                        };

                        handler.handleNetworkError(error, 'test-operation', retryFn);

                        // Wait for DOM to be ready
                        await new Promise(resolve => setTimeout(resolve, 10));

                        const retryButton = document.querySelector('.error-retry-button');
                        expect(retryButton).toBeTruthy();
                        
                        retryButton.click();

                        // Wait longer for async operation (handler has 1000ms initial delay + exponential backoff)
                        // First attempt has 1000ms delay, so wait at least 2000ms to be safe
                        await new Promise(resolve => setTimeout(resolve, 2500));
                        
                        expect(retryCalled).toBe(true);
                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        }, { timeout: 180000 });

        it('should clear error banner when retry button is clicked', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 400, max: 599 }),
                    (message, statusCode) => {
                        // Clear DOM state before each iteration
                        document.body.innerHTML = '<div id="error-container"></div>';
                        
                        const errorDisplay = new ErrorDisplayComponent();
                        const error = new NetworkError(message, statusCode, null);
                        const handler = new GlobalErrorHandler(errorDisplay);
                        const retryFn = () => Promise.resolve();

                        handler.handleNetworkError(error, 'test-operation', retryFn);

                        // Query immediately - showError is synchronous
                        const initialBannerCount = document.querySelectorAll('.error-banner').length;
                        expect(initialBannerCount).toBeGreaterThan(0);

                        const retryButton = document.querySelector('.error-retry-button');
                        expect(retryButton).toBeTruthy();
                        
                        retryButton.click();

                        const afterClickBannerCount = document.querySelectorAll('.error-banner').length;
                        expect(afterClickBannerCount).toBe(initialBannerCount - 1);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
