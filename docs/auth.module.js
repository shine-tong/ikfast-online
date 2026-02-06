/**
 * AuthenticationManager - Manages GitHub API authentication
 * Handles token storage, validation, and UI for token input
 * ES Module version for testing
 */

export class AuthenticationManager {
    constructor() {
        this.token = null;
        this.isAuthenticated = false;
        this.scopes = [];
        this.tokenKey = 'github_token';
        
        // Load token from sessionStorage on initialization
        this.loadToken();
    }
    
    /**
     * Get the current token
     * @returns {string|null} The GitHub token or null if not set
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Set and store the token
     * @param {string} token - The GitHub Personal Access Token
     */
    setToken(token) {
        if (!token || typeof token !== 'string') {
            throw new Error('Token must be a non-empty string');
        }
        
        this.token = token.trim();
        sessionStorage.setItem(this.tokenKey, this.token);
        this.isAuthenticated = true;
    }
    
    /**
     * Load token from sessionStorage
     * @private
     */
    loadToken() {
        const storedToken = sessionStorage.getItem(this.tokenKey);
        if (storedToken) {
            this.token = storedToken;
            this.isAuthenticated = true;
        }
    }
    
    /**
     * Clear the stored token
     */
    clearToken() {
        this.token = null;
        this.isAuthenticated = false;
        this.scopes = [];
        sessionStorage.removeItem(this.tokenKey);
    }
    
    /**
     * Validate the token by making a test API call to GitHub
     * @param {string} token - The token to validate
     * @returns {Promise<{valid: boolean, scopes: string[], error?: string}>}
     */
    async validateToken(token) {
        if (!token || typeof token !== 'string' || token.trim().length === 0) {
            return {
                valid: false,
                scopes: [],
                error: 'Token is empty or invalid'
            };
        }
        
        try {
            const response = await fetch(`${CONFIG.GITHUB_API_BASE}/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': CONFIG.GITHUB_API_VERSION
                }
            });
            
            if (response.ok) {
                // Extract scopes from response headers
                const scopesHeader = response.headers.get('X-OAuth-Scopes');
                const scopes = scopesHeader ? scopesHeader.split(',').map(s => s.trim()) : [];
                
                this.scopes = scopes;
                
                return {
                    valid: true,
                    scopes: scopes
                };
            } else if (response.status === 401) {
                return {
                    valid: false,
                    scopes: [],
                    error: 'Invalid token or token has expired'
                };
            } else if (response.status === 403) {
                return {
                    valid: false,
                    scopes: [],
                    error: 'Token does not have sufficient permissions'
                };
            } else {
                return {
                    valid: false,
                    scopes: [],
                    error: `GitHub API returned status ${response.status}`
                };
            }
        } catch (error) {
            return {
                valid: false,
                scopes: [],
                error: `Network error: ${error.message}`
            };
        }
    }
    
    /**
     * Check if the user is authenticated
     * @returns {boolean}
     */
    isUserAuthenticated() {
        return this.isAuthenticated && this.token !== null;
    }
    
    /**
     * Get the current scopes
     * @returns {string[]}
     */
    getScopes() {
        return this.scopes;
    }
    
    /**
     * Initialize the authentication UI
     * @param {Object} elements - DOM elements for the auth UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set up event listeners
        if (elements.authButton) {
            elements.authButton.addEventListener('click', () => this.handleAuthentication());
        }
        
        if (elements.tokenInput) {
            elements.tokenInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAuthentication();
                }
            });
            
            // Load stored token into input field
            if (this.token) {
                elements.tokenInput.value = this.token;
            }
        }
        
        // Update UI state
        this.updateUIState();
    }
    
    /**
     * Handle authentication button click
     * @private
     */
    async handleAuthentication() {
        if (!this.elements || !this.elements.tokenInput) {
            console.error('Authentication UI not initialized');
            return;
        }
        
        const token = this.elements.tokenInput.value.trim();
        
        if (!token) {
            this.showError('璇疯緭鍏?GitHub Token');
            return;
        }
        
        // Disable button and show loading state
        if (this.elements.authButton) {
            this.elements.authButton.disabled = true;
            this.elements.authButton.textContent = '楠岃瘉涓?..';
        }
        
        try {
            const result = await this.validateToken(token);
            
            if (result.valid) {
                this.setToken(token);
                this.scopes = result.scopes;
                this.showSuccess('Token 楠岃瘉鎴愬姛');
                this.updateUIState();
                
                // Trigger custom event for other components
                window.dispatchEvent(new CustomEvent('authenticationSuccess', {
                    detail: { scopes: result.scopes }
                }));
            } else {
                this.clearToken();
                this.showError(result.error || 'Token 楠岃瘉澶辫触');
                this.updateUIState();
            }
        } catch (error) {
            this.clearToken();
            this.showError(`楠岃瘉澶辫触: ${error.message}`);
            this.updateUIState();
        } finally {
            // Re-enable button
            if (this.elements.authButton) {
                this.elements.authButton.disabled = false;
                this.elements.authButton.textContent = '楠岃瘉';
            }
        }
    }
    
    /**
     * Update UI state based on authentication status
     * @private
     */
    updateUIState() {
        if (!this.elements) return;
        
        if (this.isAuthenticated) {
            // Show authenticated state
            if (this.elements.authSection) {
                this.elements.authSection.classList.add('authenticated');
            }
            if (this.elements.authButton) {
                this.elements.authButton.textContent = '宸查獙璇?;
                this.elements.authButton.classList.add('authenticated');
            }
        } else {
            // Show unauthenticated state
            if (this.elements.authSection) {
                this.elements.authSection.classList.remove('authenticated');
            }
            if (this.elements.authButton) {
                this.elements.authButton.textContent = '楠岃瘉';
                this.elements.authButton.classList.remove('authenticated');
            }
        }
    }
    
    /**
     * Show error message
     * @private
     */
    showError(message) {
        if (this.elements && this.elements.errorDisplay) {
            this.elements.errorDisplay.textContent = message;
            this.elements.errorDisplay.style.display = 'block';
            this.elements.errorDisplay.className = 'auth-message error';
        } else {
            console.error('Auth Error:', message);
        }
    }
    
    /**
     * Show success message
     * @private
     */
    showSuccess(message) {
        if (this.elements && this.elements.errorDisplay) {
            this.elements.errorDisplay.textContent = message;
            this.elements.errorDisplay.style.display = 'block';
            this.elements.errorDisplay.className = 'auth-message success';
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                if (this.elements.errorDisplay) {
                    this.elements.errorDisplay.style.display = 'none';
                }
            }, 3000);
        } else {
            console.log('Auth Success:', message);
        }
    }
}
