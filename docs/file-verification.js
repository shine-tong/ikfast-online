/**
 * FileVerification - Utility for verifying file integrity
 * Non-module version for browser use
 */

class FileVerification {
    /**
     * Verify that a file exists and has content
     * @param {Blob|File} file - The file to verify
     * @returns {{valid: boolean, error?: string, size: number}}
     */
    static verifyFileExists(file) {
        if (!file) {
            return {
                valid: false,
                error: 'File is missing',
                size: 0
            };
        }
        
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File is empty (0 bytes)',
                size: 0
            };
        }
        
        return {
            valid: true,
            size: file.size
        };
    }
    
    /**
     * Compute SHA-256 checksum of a file
     * @param {Blob|File} file - The file to compute checksum for
     * @returns {Promise<string>} Hex-encoded SHA-256 checksum
     */
    static async computeChecksum(file) {
        try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Compute SHA-256 hash
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            
            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            console.error('Error computing checksum:', error);
            throw new Error('Failed to compute file checksum');
        }
    }
    
    /**
     * Verify file integrity with checksum
     * @param {Blob|File} file - The file to verify
     * @param {string} expectedChecksum - Expected SHA-256 checksum (hex)
     * @returns {Promise<{valid: boolean, error?: string, checksum: string}>}
     */
    static async verifyChecksum(file, expectedChecksum) {
        try {
            const actualChecksum = await this.computeChecksum(file);
            
            if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
                return {
                    valid: false,
                    error: 'Checksum mismatch - file may be corrupted',
                    checksum: actualChecksum
                };
            }
            
            return {
                valid: true,
                checksum: actualChecksum
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                checksum: ''
            };
        }
    }
    
    /**
     * Extract checksum from build log
     * @param {string} logContent - Build log content
     * @returns {string|null} Extracted checksum or null if not found
     */
    static extractChecksumFromLog(logContent) {
        // Look for SHA-256 checksum in log (format: "sha256sum outputs/ikfast_solver.cpp")
        // Expected format: "<checksum>  outputs/ikfast_solver.cpp"
        const checksumRegex = /([a-f0-9]{64})\s+outputs\/ikfast_solver\.cpp/i;
        const match = logContent.match(checksumRegex);
        
        if (match && match[1]) {
            return match[1];
        }
        
        return null;
    }
    
    /**
     * Verify downloaded artifact file
     * @param {Blob|File} file - The downloaded file
     * @param {string} logContent - Build log content containing checksum
     * @returns {Promise<{valid: boolean, error?: string, checksum?: string, expectedChecksum?: string}>}
     */
    static async verifyArtifactFile(file, logContent) {
        // First verify file exists and has content
        const existsCheck = this.verifyFileExists(file);
        if (!existsCheck.valid) {
            return existsCheck;
        }
        
        // Extract expected checksum from log
        const expectedChecksum = this.extractChecksumFromLog(logContent);
        
        if (!expectedChecksum) {
            // If no checksum in log, just verify file exists
            return {
                valid: true,
                checksum: await this.computeChecksum(file),
                expectedChecksum: null
            };
        }
        
        // Verify checksum matches
        const checksumResult = await this.verifyChecksum(file, expectedChecksum);
        
        return {
            ...checksumResult,
            expectedChecksum: expectedChecksum
        };
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
