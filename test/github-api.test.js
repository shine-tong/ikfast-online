import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubAPIClient, GitHubAPIError, NetworkError } from '../web/github-api.module.js';

// Mock AuthenticationManager
class MockAuthManager {
  constructor(token = 'ghp_test123') {
    this.token = token;
  }
  
  getToken() {
    return this.token;
  }
  
  setToken(token) {
    this.token = token;
  }
}

describe('GitHubAPIClient', () => {
  let githubAPI;
  let mockAuthManager;

  beforeEach(() => {
    mockAuthManager = new MockAuthManager();
    githubAPI = new GitHubAPIClient(mockAuthManager);
    global.fetch = vi.fn();
  });

  describe('API Request Formatting', () => {
    it('should include authentication headers in requests', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ content: { sha: 'abc123' } })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await githubAPI.uploadFile('test.txt', 'content');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer ghp_test123',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          })
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      mockAuthManager.setToken(null);

      await expect(
        githubAPI.uploadFile('test.txt', 'content')
      ).rejects.toThrow(GitHubAPIError);
      
      await expect(
        githubAPI.uploadFile('test.txt', 'content')
      ).rejects.toThrow('Not authenticated');
    });

    it('should construct full URL from endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ content: { sha: 'abc123' } })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await githubAPI.uploadFile('jobs/current/robot.urdf', 'content');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/test-owner/test-repo/contents/jobs/current/robot.urdf',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Bad credentials' })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        githubAPI.uploadFile('test.txt', 'content')
      ).rejects.toThrow(GitHubAPIError);
      
      try {
        await githubAPI.uploadFile('test.txt', 'content');
      } catch (error) {
        expect(error.statusCode).toBe(401);
        expect(error.name).toBe('GitHubAPIError');
      }
    });

    it('should handle 403 forbidden errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: async () => ({ message: 'Rate limit exceeded' })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        githubAPI.triggerWorkflow('ikfast.yml', {})
      ).rejects.toThrow(GitHubAPIError);
      
      try {
        await githubAPI.triggerWorkflow('ikfast.yml', {});
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('should handle 404 not found errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        githubAPI.getWorkflowRun(999999)
      ).rejects.toThrow(GitHubAPIError);
      
      try {
        await githubAPI.getWorkflowRun(999999);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it('should handle 422 validation errors', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        json: async () => ({ message: 'Validation Failed' })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        githubAPI.uploadFile('test.txt', 'content')
      ).rejects.toThrow(GitHubAPIError);
      
      try {
        await githubAPI.uploadFile('test.txt', 'content');
      } catch (error) {
        expect(error.statusCode).toBe(422);
      }
    });

    it('should handle 5xx server errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        githubAPI.uploadFile('test.txt', 'content')
      ).rejects.toThrow(GitHubAPIError);
      
      try {
        await githubAPI.uploadFile('test.txt', 'content');
      } catch (error) {
        expect(error.statusCode).toBe(500);
      }
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      await expect(
        githubAPI.uploadFile('test.txt', 'content')
      ).rejects.toThrow(NetworkError);
    });
  });

  describe('uploadFile', () => {
    it('should upload file with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: {
            sha: 'abc123',
            name: 'robot.urdf',
            path: 'jobs/current/robot.urdf'
          }
        })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.uploadFile(
        'jobs/current/robot.urdf',
        'test content',
        'Upload URDF'
      );

      expect(result.success).toBe(true);
      expect(result.sha).toBe('abc123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('jobs/current/robot.urdf'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('message')
        })
      );
    });

    it('should base64 encode file content', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ content: { sha: 'abc123' } })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await githubAPI.uploadFile('test.txt', 'Hello World');

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      // Verify content is base64 encoded
      expect(body.content).toBe(btoa(unescape(encodeURIComponent('Hello World'))));
    });

    it('should include SHA when updating existing file', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ content: { sha: 'new123' } })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await githubAPI.uploadFile('test.txt', 'content', 'Update', 'old123');

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.sha).toBe('old123');
    });
  });

  describe('triggerWorkflow', () => {
    it('should trigger workflow with inputs', async () => {
      const mockResponse = {
        ok: true,
        status: 204
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.triggerWorkflow('ikfast.yml', {
        mode: 'generate',
        base_link: '1',
        ee_link: '8'
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ikfast.yml'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('inputs')
        })
      );
    });

    it('should use default ref when not specified', async () => {
      const mockResponse = {
        ok: true,
        status: 204
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await githubAPI.triggerWorkflow('ikfast.yml', {});

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.ref).toBe('main');
    });
  });

  describe('getWorkflowRun', () => {
    it('should get workflow run details', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 12345,
          name: 'IKFast Generator',
          status: 'completed',
          conclusion: 'success',
          workflow_id: 67890,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:05:00Z',
          html_url: 'https://github.com/test/repo/actions/runs/12345',
          run_number: 42,
          event: 'workflow_dispatch'
        })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.getWorkflowRun(12345);

      expect(result.id).toBe(12345);
      expect(result.status).toBe('completed');
      expect(result.conclusion).toBe('success');
      expect(result.workflowId).toBe(67890);
    });
  });

  describe('listArtifacts', () => {
    it('should list artifacts for a workflow run', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          artifacts: [
            {
              id: 111,
              name: 'ikfast-result',
              size_in_bytes: 1024000,
              url: 'https://api.github.com/repos/test/repo/actions/artifacts/111',
              archive_download_url: 'https://api.github.com/repos/test/repo/actions/artifacts/111/zip',
              expired: false,
              created_at: '2024-01-01T00:05:00Z',
              expires_at: '2024-01-08T00:05:00Z'
            }
          ]
        })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.listArtifacts(12345);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(111);
      expect(result[0].name).toBe('ikfast-result');
      expect(result[0].sizeInBytes).toBe(1024000);
    });
  });

  describe('downloadArtifact', () => {
    it('should download artifact as blob', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/zip' });
      const mockResponse = {
        ok: true,
        blob: async () => mockBlob
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.downloadArtifact(111);

      expect(result).toBeInstanceOf(Blob);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/artifacts/111/zip'),
        expect.any(Object)
      );
    });
  });

  describe('hasActiveWorkflow', () => {
    it('should return true when there are active workflows', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          workflow_runs: [
            {
              id: 1,
              name: 'Test',
              status: 'in_progress',
              conclusion: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:01:00Z',
              html_url: 'https://github.com/test/repo/actions/runs/1'
            }
          ]
        })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.hasActiveWorkflow('ikfast.yml');

      expect(result).toBe(true);
    });

    it('should return false when there are no active workflows', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          workflow_runs: [
            {
              id: 1,
              name: 'Test',
              status: 'completed',
              conclusion: 'success',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:05:00Z',
              html_url: 'https://github.com/test/repo/actions/runs/1'
            }
          ]
        })
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await githubAPI.hasActiveWorkflow('ikfast.yml');

      expect(result).toBe(false);
    });
  });
});
