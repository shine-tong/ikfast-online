import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthenticationManager } from '../web/auth.module.js';

describe('AuthenticationManager', () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthenticationManager();
    sessionStorage.clear();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('Token Storage and Retrieval', () => {
    it('should initialize with no token', () => {
      expect(authManager.getToken()).toBeNull();
      expect(authManager.isUserAuthenticated()).toBe(false);
    });

    it('should store token in sessionStorage when setToken is called', () => {
      const testToken = 'ghp_test123456';
      authManager.setToken(testToken);

      expect(authManager.getToken()).toBe(testToken);
      expect(sessionStorage.getItem('github_token')).toBe(testToken);
      expect(authManager.isUserAuthenticated()).toBe(true);
    });

    it('should load token from sessionStorage on initialization', () => {
      const testToken = 'ghp_stored123';
      sessionStorage.setItem('github_token', testToken);

      const newAuthManager = new AuthenticationManager();
      expect(newAuthManager.getToken()).toBe(testToken);
      expect(newAuthManager.isUserAuthenticated()).toBe(true);
    });

    it('should trim whitespace from token', () => {
      const testToken = '  ghp_test123  ';
      authManager.setToken(testToken);

      expect(authManager.getToken()).toBe('ghp_test123');
    });

    it('should throw error when setting empty token', () => {
      expect(() => authManager.setToken('')).toThrow('Token must be a non-empty string');
      expect(() => authManager.setToken(null)).toThrow('Token must be a non-empty string');
      expect(() => authManager.setToken(undefined)).toThrow('Token must be a non-empty string');
    });

    it('should clear token and sessionStorage', () => {
      authManager.setToken('ghp_test123');
      authManager.clearToken();

      expect(authManager.getToken()).toBeNull();
      expect(authManager.isUserAuthenticated()).toBe(false);
      expect(sessionStorage.getItem('github_token')).toBeNull();
    });
  });

  describe('Token Validation', () => {
    it('should return invalid for empty token', async () => {
      const result = await authManager.validateToken('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is empty or invalid');
    });

    it('should return invalid for null token', async () => {
      const result = await authManager.validateToken(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is empty or invalid');
    });

    it('should validate token with successful API response', async () => {
      const testToken = 'ghp_valid123';
      const mockResponse = {
        ok: true,
        headers: {
          get: (key) => {
            if (key === 'X-OAuth-Scopes') {
              return 'repo, workflow';
            }
            return null;
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await authManager.validateToken(testToken);

      expect(result.valid).toBe(true);
      expect(result.scopes).toEqual(['repo', 'workflow']);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testToken}`,
            'Accept': 'application/vnd.github+json'
          })
        })
      );
    });

    it('should return invalid for 401 unauthorized response', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await authManager.validateToken('ghp_invalid');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token or token has expired');
    });

    it('should return invalid for 403 forbidden response', async () => {
      const mockResponse = {
        ok: false,
        status: 403
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await authManager.validateToken('ghp_noperm');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token does not have sufficient permissions');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const result = await authManager.validateToken('ghp_test');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should parse scopes from response header', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: (key) => {
            if (key === 'X-OAuth-Scopes') {
              return 'repo, workflow, read:org';
            }
            return null;
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await authManager.validateToken('ghp_test');

      expect(result.valid).toBe(true);
      expect(result.scopes).toEqual(['repo', 'workflow', 'read:org']);
    });

    it('should handle missing scopes header', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: () => null
        }
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await authManager.validateToken('ghp_test');

      expect(result.valid).toBe(true);
      expect(result.scopes).toEqual([]);
    });
  });

  describe('Authentication State', () => {
    it('should return correct authentication state', () => {
      expect(authManager.isUserAuthenticated()).toBe(false);

      authManager.setToken('ghp_test');
      expect(authManager.isUserAuthenticated()).toBe(true);

      authManager.clearToken();
      expect(authManager.isUserAuthenticated()).toBe(false);
    });

    it('should return scopes', () => {
      expect(authManager.getScopes()).toEqual([]);

      authManager.scopes = ['repo', 'workflow'];
      expect(authManager.getScopes()).toEqual(['repo', 'workflow']);
    });
  });
});
