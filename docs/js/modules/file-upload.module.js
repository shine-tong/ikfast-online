/**
 * FileUploadComponent - Handles URDF file selection, validation, and upload
 * ES Module version for testing
 */

import { CONFIG } from '../config.js';

export class FileUploadComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.selectedFile = null;
        this.uploadProgress = 0;
        this.elements = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the file upload UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set up event listeners
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        if (elements.uploadButton) {
            elements.uploadButton.addEventListener('click', () => this.handleUpload());
        }
        
        // Initialize UI state
        this.updateUIState();
    }
    
    /**
     * Handle file selection
     * @param {Event} event - File input change event
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.selectedFile = null;
            this.updateUIState();
            return;
        }
        
        // Validate the file
        const validation = this.validateFile(file);
        
        if (!validation.valid) {
            this.showError(validation.error);
            this.selectedFile = null;
            this.updateUIState();
            return;
        }
        
        // File is valid
        this.selectedFile = file;
        this.clearError();
        this.updateUIState();
        
        // Display file info
        if (this.elements.fileInfo) {
            this.elements.fileInfo.textContent = `Selected: ${file.name} (${this.formatFileSize(file.size)})`;
            this.elements.fileInfo.style.display = 'block';
        }
    }
    
    /**
     * Validate file extension, size, and XML structure
     * @param {File} file - The file to validate
     * @returns {{valid: boolean, error?: string}}
     */
    validateFile(file) {
        // Validate file extension
        const extensionValidation = this.validateFileExtension(file.name);
        if (!extensionValidation.valid) {
            return extensionValidation;
        }
        
        // Validate file size
        const sizeValidation = this.validateFileSize(file.size);
        if (!sizeValidation.valid) {
            return sizeValidation;
        }
        
        // Note: XML structure validation will be done after reading the file content
        return { valid: true };
    }
    
    /**
     * Validate file extension
     * @param {string} filename - The filename to validate
     * @returns {{valid: boolean, error?: string}}
     */
    validateFileExtension(filename) {
        if (!filename || typeof filename !== 'string') {
            return {
                valid: false,
                error: CONFIG.ERROR_MESSAGES.INVALID_FILE_EXTENSION
            };
        }
        
        const hasValidExtension = CONFIG.ALLOWED_EXTENSIONS.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
            return {
                valid: false,
                error: CONFIG.ERROR_MESSAGES.INVALID_FILE_EXTENSION
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Validate file size
     * @param {number} size - The file size in bytes
     * @returns {{valid: boolean, error?: string}}
     */
    validateFileSize(size) {
        if (typeof size !== 'number' || size < 0) {
            return {
                valid: false,
                error: 'Invalid file size'
            };
        }
        
        if (size > CONFIG.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE
            };
        }
        
        if (size === 0) {
            return {
                valid: false,
                error: 'File is empty'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Validate XML structure
     * @param {string} content - The file content to validate
     * @returns {{valid: boolean, error?: string}}
     */
    validateXMLStructure(content) {
        if (!content || typeof content !== 'string') {
            return {
                valid: false,
                error: CONFIG.ERROR_MESSAGES.INVALID_XML
            };
        }
        
        // Trim whitespace for validation
        const trimmedContent = content.trim();
        if (trimmedContent.length === 0) {
            return {
                valid: false,
                error: CONFIG.ERROR_MESSAGES.INVALID_XML
            };
        }
        
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(trimmedContent, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                return {
                    valid: false,
                    error: CONFIG.ERROR_MESSAGES.INVALID_XML
                };
            }
            
            // Additional validation: check for well-formed XML
            // Verify that the document has a root element
            if (!xmlDoc.documentElement) {
                return {
                    valid: false,
                    error: CONFIG.ERROR_MESSAGES.INVALID_XML
                };
            }
            
            // Check for mismatched tags by validating tag structure
            const isWellFormed = this.validateTagStructure(trimmedContent);
            if (!isWellFormed) {
                return {
                    valid: false,
                    error: CONFIG.ERROR_MESSAGES.INVALID_XML
                };
            }
            
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: CONFIG.ERROR_MESSAGES.INVALID_XML
            };
        }
    }
    
    /**
     * Validate XML tag structure for proper nesting and matching
     * @param {string} content - The XML content to validate
     * @returns {boolean} True if tags are properly matched and nested
     */
    validateTagStructure(content) {
        // Remove XML declaration, comments, and CDATA sections
        let cleaned = content
            .replace(/<\?xml[^?]*\?>/g, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
        
        // Check for incomplete tags (< without matching >)
        let angleCount = 0;
        for (let i = 0; i < cleaned.length; i++) {
            if (cleaned[i] === '<') {
                angleCount++;
            } else if (cleaned[i] === '>') {
                angleCount--;
                if (angleCount < 0) {
                    return false; // More closing > than opening <
                }
            }
        }
        if (angleCount !== 0) {
            return false; // Unclosed < brackets
        }
        
        // Stack to track open tags
        const tagStack = [];
        
        // Regex to match tags: opening, closing, and self-closing
        const tagRegex = /<\/?([a-zA-Z_][\w:.-]*)[^>]*?(\/?)>/g;
        let match;
        
        while ((match = tagRegex.exec(cleaned)) !== null) {
            const fullTag = match[0];
            const tagName = match[1];
            const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>');
            const isClosing = fullTag.startsWith('</');
            
            if (isClosing) {
                // Closing tag - should match the most recent opening tag
                if (tagStack.length === 0) {
                    return false; // Closing tag without opening
                }
                const lastOpened = tagStack.pop();
                if (lastOpened !== tagName) {
                    return false; // Mismatched tags
                }
            } else if (!isSelfClosing) {
                // Opening tag - add to stack
                tagStack.push(tagName);
            }
            // Self-closing tags don't need to be tracked
        }
        
        // All tags should be closed
        return tagStack.length === 0;
    }
    
    /**
     * Handle file upload
     */
    async handleUpload() {
        if (!this.selectedFile) {
            this.showError('Please select a file first');
            return;
        }
        
        try {
            // Disable upload button
            if (this.elements.uploadButton) {
                this.elements.uploadButton.disabled = true;
                this.elements.uploadButton.textContent = 'Uploading...';
            }
            
            // Show progress bar
            this.showProgress(0);
            
            // Read file content
            const content = await this.readFileContent(this.selectedFile);
            
            // Validate XML structure
            const xmlValidation = this.validateXMLStructure(content);
            if (!xmlValidation.valid) {
                this.showError(xmlValidation.error);
                this.resetUploadButton();
                return;
            }
            
            // Update progress
            this.showProgress(30);
            
            // Upload to GitHub
            const result = await this.uploadToGitHub(content);
            
            // Update progress
            this.showProgress(100);
            
            // Show success message
            this.showSuccess('File uploaded successfully!');
            
            // Trigger custom event for other components
            window.dispatchEvent(new CustomEvent('fileUploaded', {
                detail: {
                    filename: this.selectedFile.name,
                    sha: result.sha,
                    path: CONFIG.URDF_PATH
                }
            }));
            
            // Reset UI after a delay
            setTimeout(() => {
                this.hideProgress();
                this.resetUploadButton();
            }, 2000);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message || CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR);
            this.hideProgress();
            this.resetUploadButton();
        }
    }
    
    /**
     * Read file content as text
     * @param {File} file - The file to read
     * @returns {Promise<string>}
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('File read failed'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Upload file to GitHub repository
     * @param {string} content - File content
     * @returns {Promise<{success: boolean, sha: string}>}
     */
    async uploadToGitHub(content) {
        try {
            // Check if file already exists to get SHA (for overwrite)
            let existingSha = null;
            try {
                const existingFile = await this.githubAPIClient.getFile(CONFIG.URDF_PATH);
                if (existingFile) {
                    existingSha = existingFile.sha;
                }
            } catch (error) {
                // If file doesn't exist, that's fine - we'll create it
                console.log('No existing file found, will create new file');
            }
            
            // Upload file (will overwrite if exists)
            const result = await this.githubAPIClient.uploadFile(
                CONFIG.URDF_PATH,
                content,
                `Upload URDF file: ${this.selectedFile.name}`,
                existingSha
            );
            
            return result;
        } catch (error) {
            // Re-throw with more context
            if (error.name === 'GitHubAPIError') {
                throw new Error(`GitHub API Error: ${error.apiMessage}`);
            } else if (error.name === 'NetworkError') {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Show upload progress
     * @param {number} percent - Progress percentage (0-100)
     */
    showProgress(percent) {
        this.uploadProgress = percent;
        
        if (this.elements.progressBar) {
            this.elements.progressBar.style.display = 'block';
            this.elements.progressBar.value = percent;
        }
        
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${percent}%`;
            this.elements.progressText.style.display = 'block';
        }
    }
    
    /**
     * Hide upload progress
     */
    hideProgress() {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.display = 'none';
        }
        
        if (this.elements.progressText) {
            this.elements.progressText.style.display = 'none';
        }
    }
    
    /**
     * Reset upload button to initial state
     */
    resetUploadButton() {
        if (this.elements.uploadButton) {
            this.elements.uploadButton.disabled = false;
            this.elements.uploadButton.textContent = 'Upload File';
        }
    }
    
    /**
     * Update UI state based on component state
     */
    updateUIState() {
        if (!this.elements) return;
        
        // Enable/disable upload button based on file selection
        if (this.elements.uploadButton) {
            this.elements.uploadButton.disabled = !this.selectedFile;
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.elements && this.elements.errorDisplay) {
            this.elements.errorDisplay.textContent = message;
            this.elements.errorDisplay.style.display = 'block';
            this.elements.errorDisplay.className = 'upload-message error';
        } else {
            console.error('Upload Error:', message);
        }
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        if (this.elements && this.elements.errorDisplay) {
            this.elements.errorDisplay.textContent = message;
            this.elements.errorDisplay.style.display = 'block';
            this.elements.errorDisplay.className = 'upload-message success';
        } else {
            console.log('Upload Success:', message);
        }
    }
    
    /**
     * Clear error message
     */
    clearError() {
        if (this.elements && this.elements.errorDisplay) {
            this.elements.errorDisplay.style.display = 'none';
            this.elements.errorDisplay.textContent = '';
        }
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * Get the currently selected file
     * @returns {File|null}
     */
    getSelectedFile() {
        return this.selectedFile;
    }
    
    /**
     * Get upload progress
     * @returns {number} Progress percentage (0-100)
     */
    getUploadProgress() {
        return this.uploadProgress;
    }
}
