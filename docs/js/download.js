/**
 * DownloadComponent - Handles artifact download and file extraction
 * ES Module version for testing
 */

class DownloadComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.elements = null;
        this.artifacts = [];
        this.workflowStatus = null;
        this.runId = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the download UI
     */
    initializeUI(elements) {
        this.elements = elements;
        this.updateDownloadLinks(false);
    }
    
    /**
     * Set workflow status to enable/disable download links
     * @param {string} status - Workflow status (completed, failed, etc.)
     * @param {number} runId - Workflow run ID
     */
    setWorkflowStatus(status, runId) {
        this.workflowStatus = status;
        this.runId = runId;
        
        // Enable downloads only if workflow completed successfully
        const isCompleted = status === 'completed';
        this.updateDownloadLinks(isCompleted);
        
        // Fetch artifacts if completed
        if (isCompleted && runId) {
            this.fetchArtifacts(runId);
        }
    }
    
    /**
     * Fetch artifacts for a workflow run
     * @param {number} runId - Workflow run ID
     * @returns {Promise<Array>} List of artifacts
     */
    async fetchArtifacts(runId) {
        try {
            this.artifacts = await this.githubAPIClient.listArtifacts(runId);
            
            // Update UI with artifact information
            this.updateArtifactInfo();
            
            return this.artifacts;
        } catch (error) {
            console.error('Failed to fetch artifacts:', error);
            this.showError(CONFIG.ERROR_MESSAGES.ARTIFACT_NOT_FOUND);
            return [];
        }
    }
    
    /**
     * Update artifact information display
     */
    updateArtifactInfo() {
        if (!this.elements) {
            return;
        }
        
        // Find the ikfast-result artifact
        const resultArtifact = this.artifacts.find(a => a.name === CONFIG.ARTIFACT_NAME);
        
        if (resultArtifact) {
            // Update file size displays
            if (this.elements.solverFileSize) {
                // Estimate solver file size (artifact is ZIP, actual file is smaller)
                const estimatedSize = Math.floor(resultArtifact.sizeInBytes * 0.8);
                this.elements.solverFileSize.textContent = `(${this.formatFileSize(estimatedSize)})`;
            }
            
            if (this.elements.logFileSize) {
                // Estimate log file size
                const estimatedSize = Math.floor(resultArtifact.sizeInBytes * 0.2);
                this.elements.logFileSize.textContent = `(${this.formatFileSize(estimatedSize)})`;
            }
            
            // Show artifact expiration info
            if (this.elements.artifactInfo) {
                const expiresAt = new Date(resultArtifact.expiresAt);
                this.elements.artifactInfo.textContent = `Artifact expires at ${expiresAt.toLocaleString()}`;
                this.elements.artifactInfo.style.display = 'block';
            }
        }
    }
    
    /**
     * Download and extract artifact
     * @param {string} filename - Specific filename to extract from ZIP
     * @returns {Promise<Blob>} Extracted file content
     */
    async downloadAndExtract(filename) {
        if (!this.runId) {
            throw new Error('No workflow run ID available');
        }
        
        // Find the artifact
        const artifact = this.artifacts.find(a => a.name === CONFIG.ARTIFACT_NAME);
        
        if (!artifact) {
            throw new Error(CONFIG.ERROR_MESSAGES.ARTIFACT_NOT_FOUND);
        }
        
        try {
            // Download artifact ZIP
            const zipBlob = await this.githubAPIClient.downloadArtifact(artifact.id);
            
            // Extract specific file from ZIP
            const extractedFile = await this.extractFileFromZip(zipBlob, filename);
            
            return extractedFile;
        } catch (error) {
            console.error('Download and extract failed:', error);
            throw error;
        }
    }
    
    /**
     * Extract a specific file from ZIP blob
     * @param {Blob} zipBlob - ZIP file as Blob
     * @param {string} filename - Filename to extract
     * @returns {Promise<Blob>} Extracted file content
     */
    async extractFileFromZip(zipBlob, filename) {
        // Use JSZip library for ZIP extraction
        // Note: This requires JSZip to be loaded in the page
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded');
        }
        
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipBlob);
        
        // Find the file in the ZIP
        const file = zipContent.file(filename);
        
        if (!file) {
            throw new Error(`File ${filename} not found in artifact`);
        }
        
        // Extract as Blob
        const blob = await file.async('blob');
        
        return blob;
    }
    
    /**
     * Trigger browser download
     * @param {Blob} blob - File content
     * @param {string} filename - Suggested filename
     */
    triggerDownload(blob, filename) {
        // Create object URL
        const url = URL.createObjectURL(blob);
        
        // Create temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revoke object URL after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    /**
     * Download ikfast_solver.cpp file
     */
    async downloadSolver() {
        if (!this.elements) {
            return;
        }
        
        try {
            // Show loading state
            if (this.elements.downloadSolverButton) {
                this.elements.downloadSolverButton.disabled = true;
                this.elements.downloadSolverButton.textContent = 'Downloading...';
            }
            
            // Download and extract
            const blob = await this.downloadAndExtract('ikfast_solver.cpp');
            
            // Trigger download
            this.triggerDownload(blob, 'ikfast_solver.cpp');
            
            // Show success message
            this.showSuccess('ikfast_solver.cpp downloaded successfully');
            
        } catch (error) {
            console.error('Solver download failed:', error);
            this.showError(`涓嬭浇澶辫触: ${error.message}`);
        } finally {
            // Reset button state
            if (this.elements.downloadSolverButton) {
                this.elements.downloadSolverButton.disabled = false;
                this.elements.downloadSolverButton.textContent = '下载 ikfast_solver.cpp';
            }
        }
    }
    
    /**
     * Download build.log file
     */
    async downloadLog() {
        if (!this.elements) {
            return;
        }
        
        try {
            // Show loading state
            if (this.elements.downloadLogButton) {
                this.elements.downloadLogButton.disabled = true;
                this.elements.downloadLogButton.textContent = 'Downloading...';
            }
            
            // Download and extract
            const blob = await this.downloadAndExtract('build.log');
            
            // Trigger download
            this.triggerDownload(blob, 'build.log');
            
            // Show success message
            this.showSuccess('build.log downloaded successfully');
            
        } catch (error) {
            console.error('Log download failed:', error);
            this.showError(`涓嬭浇澶辫触: ${error.message}`);
        } finally {
            // Reset button state
            if (this.elements.downloadLogButton) {
                this.elements.downloadLogButton.disabled = false;
                this.elements.downloadLogButton.textContent = '下载 build.log';
            }
        }
    }
    
    /**
     * Update download link enable/disable state
     * @param {boolean} enabled - Whether downloads should be enabled
     */
    updateDownloadLinks(enabled) {
        if (!this.elements) {
            return;
        }
        
        if (this.elements.downloadSolverButton) {
            this.elements.downloadSolverButton.disabled = !enabled;
            
            if (enabled) {
                this.elements.downloadSolverButton.classList.remove('disabled');
            } else {
                this.elements.downloadSolverButton.classList.add('disabled');
            }
        }
        
        if (this.elements.downloadLogButton) {
            this.elements.downloadLogButton.disabled = !enabled;
            
            if (enabled) {
                this.elements.downloadLogButton.classList.remove('disabled');
            } else {
                this.elements.downloadLogButton.classList.add('disabled');
            }
        }
        
        // Show/hide download section based on status
        if (this.elements.downloadSection) {
            if (enabled) {
                this.elements.downloadSection.style.display = 'block';
            } else {
                this.elements.downloadSection.style.display = 'none';
            }
        }
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (!this.elements || !this.elements.errorDisplay) {
            return;
        }
        
        this.elements.errorDisplay.textContent = message;
        this.elements.errorDisplay.className = 'download-message error';
        this.elements.errorDisplay.style.display = 'block';
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        if (!this.elements || !this.elements.errorDisplay) {
            return;
        }
        
        this.elements.errorDisplay.textContent = message;
        this.elements.errorDisplay.className = 'download-message success';
        this.elements.errorDisplay.style.display = 'block';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            this.clearError();
        }, 3000);
    }
    
    /**
     * Clear error/success message
     */
    clearError() {
        if (!this.elements || !this.elements.errorDisplay) {
            return;
        }
        
        this.elements.errorDisplay.style.display = 'none';
        this.elements.errorDisplay.textContent = '';
        this.elements.errorDisplay.className = '';
    }
    
    /**
     * Get current artifacts
     * @returns {Array} List of artifacts
     */
    getArtifacts() {
        return this.artifacts;
    }
    
    /**
     * Reset the component
     */
    reset() {
        this.artifacts = [];
        this.workflowStatus = null;
        this.runId = null;
        
        this.updateDownloadLinks(false);
        this.clearError();
        
        if (this.elements) {
            if (this.elements.solverFileSize) {
                this.elements.solverFileSize.textContent = '';
            }
            
            if (this.elements.logFileSize) {
                this.elements.logFileSize.textContent = '';
            }
            
            if (this.elements.artifactInfo) {
                this.elements.artifactInfo.style.display = 'none';
                this.elements.artifactInfo.textContent = '';
            }
        }
    }
}
