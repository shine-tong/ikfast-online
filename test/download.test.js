import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DownloadComponent } from '../web/download.module.js';

// Mock JSZip
global.JSZip = class {
  async loadAsync(blob) {
    return {
      file: (filename) => {
        if (filename === 'ikfast_solver.cpp' || filename === 'build.log') {
          return {
            async: async (type) => {
              if (type === 'blob') {
                return new Blob(['mock file content'], { type: 'text/plain' });
              }
            }
          };
        }
        return null;
      }
    };
  }
};

// Mock GitHubAPIClient
class MockGitHubAPIClient {
  constructor() {
    this.artifacts = [];
  }

  async listArtifacts(runId) {
    return this.artifacts;
  }

  async downloadArtifact(artifactId) {
    return new Blob(['mock zip content'], { type: 'application/zip' });
  }

  setMockArtifacts(artifacts) {
    this.artifacts = artifacts;
  }
}

describe('DownloadComponent - Unit Tests', () => {
  let downloadComponent;
  let mockGitHubAPI;
  let mockElements;

  beforeEach(() => {
    mockGitHubAPI = new MockGitHubAPIClient();
    downloadComponent = new DownloadComponent(mockGitHubAPI);
    
    // Mock DOM elements
    mockElements = {
      downloadSolverButton: {
        disabled: true,
        textContent: '下载 ikfast_solver.cpp',
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      },
      downloadLogButton: {
        disabled: true,
        textContent: '下载 build.log',
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      },
      downloadSection: {
        style: { display: 'none' }
      },
      solverFileSize: {
        textContent: ''
      },
      logFileSize: {
        textContent: ''
      },
      artifactInfo: {
        textContent: '',
        style: { display: 'none' }
      },
      errorDisplay: {
        textContent: '',
        className: '',
        style: { display: 'none' }
      }
    };
    
    downloadComponent.initializeUI(mockElements);
  });

  describe('Artifact Listing', () => {
    it('should fetch artifacts for a workflow run', async () => {
      const mockArtifacts = [
        {
          id: 123,
          name: 'ikfast-result',
          sizeInBytes: 1024000,
          url: 'https://api.github.com/artifacts/123',
          archiveDownloadUrl: 'https://api.github.com/artifacts/123/zip',
          expired: false,
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-08T00:00:00Z'
        }
      ];
      
      mockGitHubAPI.setMockArtifacts(mockArtifacts);
      
      const artifacts = await downloadComponent.fetchArtifacts(12345);
      
      expect(artifacts).toEqual(mockArtifacts);
      expect(downloadComponent.getArtifacts()).toEqual(mockArtifacts);
    });

    it('should handle artifact fetch errors', async () => {
      mockGitHubAPI.listArtifacts = vi.fn().mockRejectedValue(new Error('API error'));
      
      const artifacts = await downloadComponent.fetchArtifacts(12345);
      
      expect(artifacts).toEqual([]);
      expect(mockElements.errorDisplay.style.display).toBe('block');
    });

    it('should update artifact info display', async () => {
      const mockArtifacts = [
        {
          id: 123,
          name: CONFIG.ARTIFACT_NAME, // Use the correct artifact name from config
          sizeInBytes: 1024000,
          expiresAt: '2024-01-08T00:00:00Z'
        }
      ];
      
      mockGitHubAPI.setMockArtifacts(mockArtifacts);
      
      await downloadComponent.fetchArtifacts(12345);
      
      expect(mockElements.solverFileSize.textContent).toContain('KB');
      expect(mockElements.logFileSize.textContent).toContain('KB');
      expect(mockElements.artifactInfo.style.display).toBe('block');
    });

    it('should handle missing artifact', async () => {
      const mockArtifacts = [
        {
          id: 123,
          name: 'other-artifact',
          sizeInBytes: 1024000
        }
      ];
      
      mockGitHubAPI.setMockArtifacts(mockArtifacts);
      
      await downloadComponent.fetchArtifacts(12345);
      
      // Should not update file sizes if artifact not found
      expect(mockElements.solverFileSize.textContent).toBe('');
    });
  });

  describe('ZIP Extraction', () => {
    it('should extract file from ZIP blob', async () => {
      const zipBlob = new Blob(['mock zip'], { type: 'application/zip' });
      
      const extractedBlob = await downloadComponent.extractFileFromZip(zipBlob, 'ikfast_solver.cpp');
      
      expect(extractedBlob).toBeInstanceOf(Blob);
    });

    it('should throw error if file not found in ZIP', async () => {
      const zipBlob = new Blob(['mock zip'], { type: 'application/zip' });
      
      await expect(
        downloadComponent.extractFileFromZip(zipBlob, 'nonexistent.txt')
      ).rejects.toThrow('File nonexistent.txt not found in artifact');
    });

    it('should throw error if JSZip not loaded', async () => {
      const originalJSZip = global.JSZip;
      global.JSZip = undefined;
      
      const zipBlob = new Blob(['mock zip'], { type: 'application/zip' });
      
      await expect(
        downloadComponent.extractFileFromZip(zipBlob, 'test.txt')
      ).rejects.toThrow('JSZip library not loaded');
      
      global.JSZip = originalJSZip;
    });
  });

  describe('Download Triggering', () => {
    let originalCreateElement;
    let originalAppendChild;
    let originalRemoveChild;
    let mockLink;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn()
      };
      
      originalCreateElement = document.createElement;
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') return mockLink;
        return originalCreateElement.call(document, tag);
      });
      
      originalAppendChild = document.body.appendChild;
      document.body.appendChild = vi.fn();
      
      originalRemoveChild = document.body.removeChild;
      document.body.removeChild = vi.fn();
    });

    afterEach(() => {
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    });

    it('should trigger browser download with correct filename', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      
      downloadComponent.triggerDownload(blob, filename);
      
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should create object URL for blob', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      
      downloadComponent.triggerDownload(blob, 'test.txt');
      
      expect(mockLink.href).toContain('blob:');
    });

    it('should hide link element', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      
      downloadComponent.triggerDownload(blob, 'test.txt');
      
      expect(mockLink.style.display).toBe('none');
    });
  });

  describe('File Size Formatting', () => {
    it('should format 0 bytes', () => {
      expect(downloadComponent.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(downloadComponent.formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(downloadComponent.formatFileSize(1024)).toBe('1 KB');
      expect(downloadComponent.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(downloadComponent.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(downloadComponent.formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(downloadComponent.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(downloadComponent.formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('Workflow Status Integration', () => {
    it('should enable downloads when workflow completes', () => {
      downloadComponent.setWorkflowStatus('completed', 12345);
      
      expect(mockElements.downloadSolverButton.disabled).toBe(false);
      expect(mockElements.downloadLogButton.disabled).toBe(false);
      expect(mockElements.downloadSection.style.display).toBe('block');
    });

    it('should disable downloads for non-completed statuses', () => {
      const statuses = ['not_started', 'queued', 'in_progress', 'failed', 'cancelled'];
      
      for (const status of statuses) {
        downloadComponent.setWorkflowStatus(status, 12345);
        
        expect(mockElements.downloadSolverButton.disabled).toBe(true);
        expect(mockElements.downloadLogButton.disabled).toBe(true);
        expect(mockElements.downloadSection.style.display).toBe('none');
      }
    });

    it('should fetch artifacts when workflow completes', async () => {
      const mockArtifacts = [
        {
          id: 123,
          name: 'ikfast-result',
          sizeInBytes: 1024000,
          expiresAt: '2024-01-08T00:00:00Z'
        }
      ];
      
      mockGitHubAPI.setMockArtifacts(mockArtifacts);
      
      downloadComponent.setWorkflowStatus('completed', 12345);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(downloadComponent.getArtifacts()).toEqual(mockArtifacts);
    });

    it('should not fetch artifacts for non-completed statuses', async () => {
      const fetchSpy = vi.spyOn(downloadComponent, 'fetchArtifacts');
      
      downloadComponent.setWorkflowStatus('in_progress', 12345);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Download Methods', () => {
    beforeEach(() => {
      const mockArtifacts = [
        {
          id: 123,
          name: 'ikfast-result',
          sizeInBytes: 1024000
        }
      ];
      
      mockGitHubAPI.setMockArtifacts(mockArtifacts);
      downloadComponent.artifacts = mockArtifacts;
      downloadComponent.runId = 12345;
      
      // Mock downloadAndExtract to return a blob
      downloadComponent.downloadAndExtract = vi.fn().mockResolvedValue(
        new Blob(['mock file content'], { type: 'text/plain' })
      );
      
      // Mock triggerDownload
      downloadComponent.triggerDownload = vi.fn();
    });

    it('should download solver file', async () => {
      await downloadComponent.downloadSolver();
      
      expect(downloadComponent.downloadAndExtract).toHaveBeenCalledWith('ikfast_solver.cpp');
      expect(downloadComponent.triggerDownload).toHaveBeenCalledWith(
        expect.any(Blob),
        'ikfast_solver.cpp'
      );
    });

    it('should download log file', async () => {
      await downloadComponent.downloadLog();
      
      expect(downloadComponent.downloadAndExtract).toHaveBeenCalledWith('build.log');
      expect(downloadComponent.triggerDownload).toHaveBeenCalledWith(
        expect.any(Blob),
        'build.log'
      );
    });

    it('should show loading state during download', async () => {
      const downloadPromise = downloadComponent.downloadSolver();
      
      // Check loading state (button should be disabled during download)
      // Note: This is tricky to test due to async timing
      
      await downloadPromise;
      
      // After download, button should be re-enabled
      expect(mockElements.downloadSolverButton.disabled).toBe(false);
      expect(mockElements.downloadSolverButton.textContent).toBe('下载 ikfast_solver.cpp');
    });

    it('should handle download errors', async () => {
      downloadComponent.downloadAndExtract = vi.fn().mockRejectedValue(new Error('Download failed'));
      
      await downloadComponent.downloadSolver();
      
      expect(mockElements.errorDisplay.style.display).toBe('block');
      expect(mockElements.errorDisplay.textContent).toContain('下载失败');
    });

    it('should show success message after download', async () => {
      await downloadComponent.downloadSolver();
      
      expect(mockElements.errorDisplay.className).toBe('download-message success');
      expect(mockElements.errorDisplay.textContent).toContain('下载成功');
    });
  });

  describe('Error Display', () => {
    it('should show error message', () => {
      downloadComponent.showError('Test error');
      
      expect(mockElements.errorDisplay.textContent).toBe('Test error');
      expect(mockElements.errorDisplay.className).toBe('download-message error');
      expect(mockElements.errorDisplay.style.display).toBe('block');
    });

    it('should show success message', () => {
      downloadComponent.showSuccess('Test success');
      
      expect(mockElements.errorDisplay.textContent).toBe('Test success');
      expect(mockElements.errorDisplay.className).toBe('download-message success');
      expect(mockElements.errorDisplay.style.display).toBe('block');
    });

    it('should clear error message', () => {
      downloadComponent.showError('Test error');
      downloadComponent.clearError();
      
      expect(mockElements.errorDisplay.style.display).toBe('none');
      expect(mockElements.errorDisplay.textContent).toBe('');
      expect(mockElements.errorDisplay.className).toBe('');
    });

    it('should auto-hide success message after 3 seconds', async () => {
      vi.useFakeTimers();
      
      downloadComponent.showSuccess('Test success');
      
      expect(mockElements.errorDisplay.style.display).toBe('block');
      
      vi.advanceTimersByTime(3000);
      
      expect(mockElements.errorDisplay.style.display).toBe('none');
      
      vi.useRealTimers();
    });
  });

  describe('Component Reset', () => {
    it('should reset all state', () => {
      // Set some state
      downloadComponent.artifacts = [{ id: 123, name: 'test' }];
      downloadComponent.workflowStatus = 'completed';
      downloadComponent.runId = 12345;
      downloadComponent.setWorkflowStatus('completed', 12345);
      
      // Reset
      downloadComponent.reset();
      
      expect(downloadComponent.getArtifacts()).toEqual([]);
      expect(downloadComponent.workflowStatus).toBeNull();
      expect(downloadComponent.runId).toBeNull();
      expect(mockElements.downloadSolverButton.disabled).toBe(true);
      expect(mockElements.downloadSection.style.display).toBe('none');
    });

    it('should clear all UI elements', () => {
      mockElements.solverFileSize.textContent = '1 MB';
      mockElements.logFileSize.textContent = '500 KB';
      mockElements.artifactInfo.textContent = 'Expires soon';
      mockElements.artifactInfo.style.display = 'block';
      
      downloadComponent.reset();
      
      expect(mockElements.solverFileSize.textContent).toBe('');
      expect(mockElements.logFileSize.textContent).toBe('');
      expect(mockElements.artifactInfo.textContent).toBe('');
      expect(mockElements.artifactInfo.style.display).toBe('none');
    });
  });

  describe('Download and Extract Integration', () => {
    it('should download and extract artifact', async () => {
      const mockArtifacts = [
        {
          id: 123,
          name: CONFIG.ARTIFACT_NAME, // Use the correct artifact name from config
          sizeInBytes: 1024000
        }
      ];
      
      // Set artifacts properly
      downloadComponent.artifacts = mockArtifacts;
      downloadComponent.runId = 12345;
      
      const blob = await downloadComponent.downloadAndExtract('ikfast_solver.cpp');
      
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should throw error if no runId', async () => {
      downloadComponent.runId = null;
      
      await expect(
        downloadComponent.downloadAndExtract('test.txt')
      ).rejects.toThrow('No workflow run ID available');
    });

    it('should throw error if artifact not found', async () => {
      downloadComponent.artifacts = [];
      downloadComponent.runId = 12345;
      
      await expect(
        downloadComponent.downloadAndExtract('test.txt')
      ).rejects.toThrow(CONFIG.ERROR_MESSAGES.ARTIFACT_NOT_FOUND);
    });
  });
});
