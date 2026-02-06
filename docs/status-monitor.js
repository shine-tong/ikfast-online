/**
 * StatusMonitorComponent - Monitors GitHub Actions workflow execution status
 * ES Module version for testing
 */

class StatusMonitorComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.elements = null;
        this.runId = null;
        this.pollingInterval = null;
        this.currentInterval = CONFIG.POLLING_INTERVAL;
        this.startTime = null;
        this.lastPollTime = null;
        this.pollCount = 0;
        this.currentStatus = null;
        this.onStatusChange = null;
        this.onComplete = null;
        this.onTimeout = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the status monitor UI
     */
    initializeUI(elements) {
        this.elements = elements;
        this.updateStatusDisplay('not_started');
    }
    
    /**
     * Start polling for workflow status
     * @param {number} runId - Workflow run ID
     * @param {number} [interval] - Initial polling interval in ms (default: 5000)
     */
    startPolling(runId, interval = CONFIG.POLLING_INTERVAL) {
        if (this.pollingInterval) {
            this.stopPolling();
        }
        
        this.runId = runId;
        this.currentInterval = Math.max(interval, CONFIG.POLLING_INTERVAL); // Ensure minimum 5 seconds
        this.startTime = Date.now();
        this.lastPollTime = null;
        this.pollCount = 0;
        
        // Start polling immediately
        this.poll();
        
        // Set up interval for subsequent polls
        this.scheduleNextPoll();
    }
    
    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    /**
     * Schedule the next poll with exponential backoff
     */
    scheduleNextPoll() {
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
        }
        
        // Calculate next interval with exponential backoff
        // Start at 5s, increase to max 30s
        const backoffMultiplier = Math.min(Math.pow(1.5, Math.floor(this.pollCount / 5)), 6);
        this.currentInterval = Math.min(
            CONFIG.POLLING_INTERVAL * backoffMultiplier,
            CONFIG.POLLING_MAX_INTERVAL
        );
        
        this.pollingInterval = setTimeout(() => this.poll(), this.currentInterval);
    }
    
    /**
     * Poll for workflow status
     */
    async poll() {
        try {
            // Check for timeout (30 minutes)
            const elapsed = Date.now() - this.startTime;
            if (elapsed > CONFIG.POLLING_TIMEOUT) {
                this.handleTimeout();
                return;
            }
            
            // Ensure minimum 5 seconds between polls
            if (this.lastPollTime) {
                const timeSinceLastPoll = Date.now() - this.lastPollTime;
                if (timeSinceLastPoll < CONFIG.POLLING_INTERVAL) {
                    // Wait for the remaining time
                    await this.sleep(CONFIG.POLLING_INTERVAL - timeSinceLastPoll);
                }
            }
            
            this.lastPollTime = Date.now();
            this.pollCount++;
            
            // Get workflow run status
            const run = await this.githubAPIClient.getWorkflowRun(this.runId);
            
            // Map status
            const mappedStatus = this.mapStatus(run.status, run.conclusion);
            
            // Update display
            this.updateStatusDisplay(mappedStatus, run);
            
            // Check if status changed
            if (this.currentStatus !== mappedStatus) {
                this.currentStatus = mappedStatus;
                
                if (this.onStatusChange) {
                    this.onStatusChange(mappedStatus, run);
                }
            }
            
            // Check if workflow is complete
            if (run.status === 'completed') {
                this.stopPolling();
                
                if (this.onComplete) {
                    this.onComplete(mappedStatus, run);
                }
            } else {
                // Schedule next poll
                this.scheduleNextPoll();
            }
            
        } catch (error) {
            console.error('Polling error:', error);
            
            // Continue polling even on error (might be temporary network issue)
            this.scheduleNextPoll();
        }
    }
    
    /**
     * Map GitHub workflow status to display status
     * @param {string} status - GitHub workflow status
     * @param {string|null} conclusion - GitHub workflow conclusion
     * @returns {string} Mapped status
     */
    mapStatus(status, conclusion) {
        if (status === 'queued') {
            return 'queued';
        } else if (status === 'in_progress') {
            return 'in_progress';
        } else if (status === 'completed') {
            if (conclusion === 'success') {
                return 'completed';
            } else if (conclusion === 'failure') {
                return 'failed';
            } else if (conclusion === 'cancelled') {
                return 'cancelled';
            } else {
                return 'completed';
            }
        } else {
            return 'unknown';
        }
    }
    
    /**
     * Update status display
     * @param {string} status - Status to display
     * @param {Object} [run] - Workflow run details
     */
    updateStatusDisplay(status, run = null) {
        if (!this.elements) {
            return;
        }
        
        // Update status indicator
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.className = `status-indicator status-${status}`;
            
            const statusText = this.getStatusText(status);
            this.elements.statusIndicator.textContent = statusText;
        }
        
        // Update queue position if available
        if (this.elements.queuePosition && status === 'queued') {
            // GitHub API doesn't directly provide queue position
            // We can estimate based on other queued workflows
            this.elements.queuePosition.textContent = '鎺掗槦涓?..';
            this.elements.queuePosition.style.display = 'block';
        } else if (this.elements.queuePosition) {
            this.elements.queuePosition.style.display = 'none';
        }
        
        // Update elapsed time
        if (this.elements.elapsedTime && this.startTime) {
            const elapsed = Date.now() - this.startTime;
            const elapsedText = this.formatElapsedTime(elapsed);
            this.elements.elapsedTime.textContent = `宸茬敤鏃? ${elapsedText}`;
        }
        
        // Update run details if available
        if (run && this.elements.runDetails) {
            this.elements.runDetails.innerHTML = `
                <div>Run ID: ${run.id}</div>
                <div>Run Number: ${run.runNumber}</div>
                <div>Created: ${new Date(run.createdAt).toLocaleString()}</div>
                <div>Updated: ${new Date(run.updatedAt).toLocaleString()}</div>
            `;
        }
    }
    
    /**
     * Get status text for display
     * @param {string} status - Status code
     * @returns {string} Display text
     */
    getStatusText(status) {
        const statusMap = {
            'not_started': CONFIG.STATUS_MESSAGES.NOT_STARTED,
            'queued': CONFIG.STATUS_MESSAGES.QUEUED,
            'in_progress': CONFIG.STATUS_MESSAGES.IN_PROGRESS,
            'completed': CONFIG.STATUS_MESSAGES.COMPLETED,
            'failed': CONFIG.STATUS_MESSAGES.FAILED,
            'cancelled': CONFIG.STATUS_MESSAGES.CANCELLED
        };
        
        return statusMap[status] || status;
    }
    
    /**
     * Format elapsed time
     * @param {number} ms - Milliseconds
     * @returns {string} Formatted time
     */
    formatElapsedTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Handle timeout
     */
    handleTimeout() {
        this.stopPolling();
        this.updateStatusDisplay('failed');
        
        if (this.elements && this.elements.statusIndicator) {
            this.elements.statusIndicator.textContent = '瓒呮椂锛?0鍒嗛挓锛?;
        }
        
        if (this.onTimeout) {
            this.onTimeout();
        }
    }
    
    /**
     * Get current status
     * @returns {string|null} Current status
     */
    getCurrentStatus() {
        return this.currentStatus;
    }
    
    /**
     * Get polling state
     * @returns {{isPolling: boolean, runId: number|null, pollCount: number}}
     */
    getPollingState() {
        return {
            isPolling: this.pollingInterval !== null,
            runId: this.runId,
            pollCount: this.pollCount,
            currentInterval: this.currentInterval
        };
    }
    
    /**
     * Reset the component
     */
    reset() {
        this.stopPolling();
        this.runId = null;
        this.currentInterval = CONFIG.POLLING_INTERVAL;
        this.startTime = null;
        this.lastPollTime = null;
        this.pollCount = 0;
        this.currentStatus = null;
        
        if (this.elements) {
            this.updateStatusDisplay('not_started');
            
            if (this.elements.queuePosition) {
                this.elements.queuePosition.style.display = 'none';
            }
            
            if (this.elements.elapsedTime) {
                this.elements.elapsedTime.textContent = '';
            }
            
            if (this.elements.runDetails) {
                this.elements.runDetails.innerHTML = '';
            }
        }
    }
    
    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
