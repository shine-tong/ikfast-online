import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { DownloadComponent } from '../web/download.module.js';

// Mock GitHubAPIClient
class MockGitHubAPIClient {
  constructor() {
    this.artifacts = [];
  }

  async listArtifacts(runId) {
    return this.artifacts;
  }

  async downloadArtifact(artifactId) {
    // Return a mock blob
    return new Blob(['mock artifact content'], { type: 'application/zip' });
  }

  setMockArtifacts(artifacts) {
    this.artifacts = artifacts;
  }
}

describe('DownloadComponent - Property-Based Tests', () => {
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

  describe('Property 24: Download Link Availability', () => {
    it('should enable download links only when workflow status is completed', () => {
      // Tag: Feature: ikfast-online-generator, Property 24: Download link availability
      fc.assert(
        fc.property(
          fc.constantFrom('not_started', 'queued', 'in_progress', 'completed', 'failed', 'cancelled'),
          fc.integer({ min: 1, max: 1000000 }),
          (status, runId) => {
            // Set workflow status
            downloadComponent.setWorkflowStatus(status, runId);
            
            // Property: download buttons should be enabled only when status is 'completed'
            const shouldBeEnabled = status === 'completed';
            const solverButtonEnabled = !mockElements.downloadSolverButton.disabled;
            const logButtonEnabled = !mockElements.downloadLogButton.disabled;
            
            return solverButtonEnabled === shouldBeEnabled && 
                   logButtonEnabled === shouldBeEnabled;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show download section only when workflow is completed', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('not_started', 'queued', 'in_progress', 'completed', 'failed', 'cancelled'),
          fc.integer({ min: 1, max: 1000000 }),
          (status, runId) => {
            downloadComponent.setWorkflowStatus(status, runId);
            
            // Property: download section should be visible only when status is 'completed'
            const shouldBeVisible = status === 'completed';
            const isVisible = mockElements.downloadSection.style.display === 'block';
            
            return isVisible === shouldBeVisible;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should disable download links when status changes from completed to non-completed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('queued', 'in_progress', 'failed', 'cancelled'),
          (runId, newStatus) => {
            // First set to completed
            downloadComponent.setWorkflowStatus('completed', runId);
            const wasEnabled = !mockElements.downloadSolverButton.disabled;
            
            // Then change to non-completed status
            downloadComponent.setWorkflowStatus(newStatus, runId);
            const isEnabled = !mockElements.downloadSolverButton.disabled;
            
            // Property: buttons should be disabled after status changes from completed
            return wasEnabled === true && isEnabled === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain disabled state for non-completed statuses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('not_started', 'queued', 'in_progress', 'failed', 'cancelled'),
          fc.constantFrom('not_started', 'queued', 'in_progress', 'failed', 'cancelled'),
          fc.integer({ min: 1, max: 1000000 }),
          (status1, status2, runId) => {
            // Set first non-completed status
            downloadComponent.setWorkflowStatus(status1, runId);
            const disabled1 = mockElements.downloadSolverButton.disabled;
            
            // Set second non-completed status
            downloadComponent.setWorkflowStatus(status2, runId);
            const disabled2 = mockElements.downloadSolverButton.disabled;
            
            // Property: buttons should remain disabled for all non-completed statuses
            return disabled1 === true && disabled2 === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null or undefined runId gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('completed', 'failed'),
          fc.oneof(fc.constant(null), fc.constant(undefined)),
          (status, runId) => {
            // Should not throw error
            try {
              downloadComponent.setWorkflowStatus(status, runId);
              return true;
            } catch (error) {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply correct CSS classes based on enabled state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('completed', 'failed'),
          fc.integer({ min: 1, max: 1000000 }),
          (status, runId) => {
            downloadComponent.setWorkflowStatus(status, runId);
            
            const isCompleted = status === 'completed';
            
            if (isCompleted) {
              // Property: 'disabled' class should be removed when enabled
              expect(mockElements.downloadSolverButton.classList.remove).toHaveBeenCalledWith('disabled');
              expect(mockElements.downloadLogButton.classList.remove).toHaveBeenCalledWith('disabled');
            } else {
              // Property: 'disabled' class should be added when disabled
              expect(mockElements.downloadSolverButton.classList.add).toHaveBeenCalledWith('disabled');
              expect(mockElements.downloadLogButton.classList.add).toHaveBeenCalledWith('disabled');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset download links to disabled state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          (runId) => {
            // Enable downloads
            downloadComponent.setWorkflowStatus('completed', runId);
            
            // Reset
            downloadComponent.reset();
            
            // Property: after reset, download links should be disabled
            return mockElements.downloadSolverButton.disabled === true &&
                   mockElements.downloadLogButton.disabled === true &&
                   mockElements.downloadSection.style.display === 'none';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 25: Artifact Download', () => {
    it('should trigger browser download with correct filename for solver', () => {
      // Tag: Feature: ikfast-online-generator, Property 25: Artifact download
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (content) => {
            const blob = new Blob([content], { type: 'text/plain' });
            const filename = 'ikfast_solver.cpp';
            
            // Mock document methods
            const mockLink = {
              href: '',
              download: '',
              style: { display: '' },
              click: vi.fn()
            };
            
            const originalCreateElement = document.createElement;
            document.createElement = vi.fn((tag) => {
              if (tag === 'a') return mockLink;
              return originalCreateElement.call(document, tag);
            });
            
            const originalAppendChild = document.body.appendChild;
            document.body.appendChild = vi.fn();
            
            const originalRemoveChild = document.body.removeChild;
            document.body.removeChild = vi.fn();
            
            // Trigger download
            downloadComponent.triggerDownload(blob, filename);
            
            // Property: download should be triggered with correct filename
            const result = mockLink.download === filename && mockLink.click.mock.calls.length === 1;
            
            // Restore
            document.createElement = originalCreateElement;
            document.body.appendChild = originalAppendChild;
            document.body.removeChild = originalRemoveChild;
            
            return result;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger browser download with correct filename for log', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (content) => {
            const blob = new Blob([content], { type: 'text/plain' });
            const filename = 'build.log';
            
            // Mock document methods
            const mockLink = {
              href: '',
              download: '',
              style: { display: '' },
              click: vi.fn()
            };
            
            const originalCreateElement = document.createElement;
            document.createElement = vi.fn((tag) => {
              if (tag === 'a') return mockLink;
              return originalCreateElement.call(document, tag);
            });
            
            const originalAppendChild = document.body.appendChild;
            document.body.appendChild = vi.fn();
            
            const originalRemoveChild = document.body.removeChild;
            document.body.removeChild = vi.fn();
            
            // Trigger download
            downloadComponent.triggerDownload(blob, filename);
            
            // Property: download should be triggered with correct filename
            const result = mockLink.download === filename && mockLink.click.mock.calls.length === 1;
            
            // Restore
            document.createElement = originalCreateElement;
            document.body.appendChild = originalAppendChild;
            document.body.removeChild = originalRemoveChild;
            
            return result;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various blob sizes correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 * 1024 * 1024 }),
          (size) => {
            const content = 'x'.repeat(size);
            const blob = new Blob([content], { type: 'text/plain' });
            
            // Property: blob size should match content size
            return blob.size === size;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create unique object URLs for each download', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
          (contents) => {
            const urls = new Set();
            
            for (const content of contents) {
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              urls.add(url);
              URL.revokeObjectURL(url);
            }
            
            // Property: each blob should get a unique URL
            return urls.size === contents.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty blob downloads', () => {
      const blob = new Blob([], { type: 'text/plain' });
      const filename = 'empty.txt';
      
      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn()
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') return mockLink;
        return originalCreateElement.call(document, tag);
      });
      
      const originalAppendChild = document.body.appendChild;
      document.body.appendChild = vi.fn();
      
      const originalRemoveChild = document.body.removeChild;
      document.body.removeChild = vi.fn();
      
      // Should not throw error
      try {
        downloadComponent.triggerDownload(blob, filename);
        
        // Restore
        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
        
        expect(mockLink.click).toHaveBeenCalled();
      } catch (error) {
        // Restore
        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
        
        throw error;
      }
    });
  });

  describe('File Size Formatting Property', () => {
    it('should format file sizes correctly across all ranges', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 * 1024 * 1024 * 1024 }),
          (bytes) => {
            const formatted = downloadComponent.formatFileSize(bytes);
            
            // Property: formatted string should contain a number and a unit
            const hasNumber = /\d+(\.\d+)?/.test(formatted);
            const hasUnit = /(Bytes|KB|MB|GB)/.test(formatted);
            
            return hasNumber && hasUnit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format zero bytes correctly', () => {
      const result = downloadComponent.formatFileSize(0);
      expect(result).toBe('0 Bytes');
    });

    it('should format 1 KB correctly', () => {
      const result = downloadComponent.formatFileSize(1024);
      expect(result).toBe('1 KB');
    });

    it('should format 1 MB correctly', () => {
      const result = downloadComponent.formatFileSize(1024 * 1024);
      expect(result).toBe('1 MB');
    });

    it('should format fractional sizes correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 511 }),
          (offset) => {
            const bytes = 1024 + offset;
            const formatted = downloadComponent.formatFileSize(bytes);
            
            // Property: should be between 1 and 1.5 KB
            const match = formatted.match(/^(\d+(\.\d+)?)\s+KB$/);
            if (!match) return false;
            
            const value = parseFloat(match[1]);
            return value >= 1 && value <= 1.5;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
