/**
 * LogViewerComponent - Displays real-time workflow execution logs
 * ES Module version for testing
 */

export class LogViewerComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.elements = null;
        this.logContent = '';
        this.autoScroll = true;
        this.runId = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the log viewer UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set up auto-scroll toggle if available
        if (this.elements.autoScrollToggle) {
            this.elements.autoScrollToggle.checked = this.autoScroll;
            this.elements.autoScrollToggle.addEventListener('change', (e) => {
                this.autoScroll = e.target.checked;
            });
        }
        
        // Initialize log viewer with monospace font
        if (this.elements.logViewer) {
            this.elements.logViewer.style.fontFamily = 'monospace';
            this.elements.logViewer.style.whiteSpace = 'pre-wrap';
            this.elements.logViewer.style.overflowY = 'auto';
        }
    }
    
    /**
     * Fetch logs from workflow run or artifact
     * @param {number} runId - Workflow run ID
     * @returns {Promise<string>} Log content
     */
    async fetchLogs(runId) {
        try {
            this.runId = runId;
            
            // Try to get logs from workflow run first
            try {
                const logs = await this.githubAPIClient.getWorkflowLogs(runId);
                return logs;
            } catch (error) {
                // If workflow logs not available, try to get from artifact
                console.log('Workflow logs not available, trying artifact...');
                
                const artifacts = await this.githubAPIClient.listArtifacts(runId);
                const logArtifact = artifacts.find(a => 
                    a.name === 'ikfast-result' || a.name.includes('log')
                );
                
                if (logArtifact) {
                    const artifactData = await this.githubAPIClient.downloadArtifact(logArtifact.id);
                    // Extract log file from ZIP (simplified - in real implementation would use JSZip)
                    return artifactData;
                }
                
                throw new Error('No logs available');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    }
    
    /**
     * Append log content (incremental, not clearing)
     * @param {string} content - Log content to append
     */
    appendLog(content) {
        if (!content) {
            return;
        }
        
        // Append to internal log content
        this.logContent += content;
        
        // Update display
        this.updateDisplay();
    }
    
    /**
     * Update the log display with current content
     */
    updateDisplay() {
        if (!this.elements || !this.elements.logViewer) {
            return;
        }
        
        // Process log content: highlight STEP markers, handle ANSI codes, style errors
        const processedContent = this.processLogContent(this.logContent);
        
        // Update DOM
        this.elements.logViewer.innerHTML = processedContent;
        
        // Auto-scroll to bottom if enabled
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    /**
     * Process log content: highlight STEP markers, handle ANSI codes, style errors
     * @param {string} content - Raw log content
     * @returns {string} Processed HTML content
     */
    processLogContent(content) {
        if (!content) {
            return '';
        }
        
        // Split into lines
        const lines = content.split('\n');
        const processedLines = [];
        
        for (const line of lines) {
            let processedLine = line;
            
            // Escape HTML
            processedLine = this.escapeHtml(processedLine);
            
            // Handle ANSI codes (convert to HTML or preserve)
            processedLine = this.handleAnsiCodes(processedLine);
            
            // Highlight STEP markers
            if (this.isStepMarker(line)) {
                processedLine = `<span class="log-step">${processedLine}</span>`;
            }
            
            // Style error lines
            if (this.isErrorLine(line)) {
                processedLine = `<span class="log-error">${processedLine}</span>`;
            }
            
            processedLines.push(processedLine);
        }
        
        return processedLines.join('\n');
    }
    
    /**
     * Check if line is a STEP marker
     * @param {string} line - Log line
     * @returns {boolean} True if line is a STEP marker
     */
    isStepMarker(line) {
        // Match patterns like "=== STEP 1: ===" or "STEP 1:" or "Step 1:"
        return /===\s*STEP\s+\d+:/i.test(line) || 
               /^STEP\s+\d+:/i.test(line) ||
               /^Step\s+\d+:/i.test(line);
    }
    
    /**
     * Check if line is an error line
     * @param {string} line - Log line
     * @returns {boolean} True if line is an error
     */
    isErrorLine(line) {
        // Match common error patterns
        const errorPatterns = [
            /error:/i,
            /failed:/i,
            /exception:/i,
            /traceback/i,
            /\[ERROR\]/i,
            /\[FAIL\]/i
        ];
        
        return errorPatterns.some(pattern => pattern.test(line));
    }
    
    /**
     * Handle ANSI escape codes - convert to HTML or preserve
     * @param {string} text - Text with potential ANSI codes
     * @returns {string} Processed text
     */
    handleAnsiCodes(text) {
        // Simple ANSI code handling - convert common codes to HTML
        // This is a simplified version - a full implementation would use a library like ansi-to-html
        
        // Remove ANSI escape sequences for now (can be enhanced later)
        // Pattern: \x1b[...m
        let processed = text.replace(/\x1b\[[0-9;]*m/g, '');
        
        // Could add color mapping here:
        // \x1b[31m -> red, \x1b[32m -> green, etc.
        
        return processed;
    }
    
    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof document !== 'undefined' && document.createElement) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Fallback for test environment
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Clear all log content
     */
    clearLog() {
        this.logContent = '';
        this.updateDisplay();
    }
    
    /**
     * Scroll to bottom of log viewer
     */
    scrollToBottom() {
        if (this.elements && this.elements.logViewer) {
            this.elements.logViewer.scrollTop = this.elements.logViewer.scrollHeight;
        }
    }
    
    /**
     * Get current log content
     * @returns {string} Current log content
     */
    getContent() {
        return this.logContent;
    }
    
    /**
     * Set auto-scroll enabled/disabled
     * @param {boolean} enabled - Auto-scroll enabled
     */
    setAutoScroll(enabled) {
        this.autoScroll = enabled;
        
        if (this.elements && this.elements.autoScrollToggle) {
            this.elements.autoScrollToggle.checked = enabled;
        }
    }
    
    /**
     * Get auto-scroll state
     * @returns {boolean} Auto-scroll enabled
     */
    getAutoScroll() {
        return this.autoScroll;
    }
    
    /**
     * Reset the component
     */
    reset() {
        this.logContent = '';
        this.runId = null;
        this.updateDisplay();
    }
}
