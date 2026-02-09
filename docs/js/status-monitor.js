/**
 * StatusMonitorComponent - Monitors GitHub Actions workflow status
 */

class StatusMonitorComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.currentRunId = null;
        this.currentStatus = null;
        this.pollingInterval = null;
        this.startTime = null;
        this.elements = null;
        
        // Callbacks
        this.onStatusChange = null;
        this.onComplete = null;
        this.onTimeout = null;
    }
    
    /**
     * Initialize UI elements
     * @param {Object} elements - DOM elements
     */
    initializeUI(elements) {
        this.elements = elements;
    }
    
    /**
     * Start polling for status
     * @param {number} runId - Workflow run ID
     */
    startPolling(runId) {
        this.currentRunId = runId;
        this.startTime = Date.now();
        
        // Initial status check
        this.checkStatus();
        
        // Poll every 5 seconds
        this.pollingInterval = setInterval(() => {
            this.checkStatus();
        }, CONFIG.POLLING_INTERVAL);
        
        // Set timeout
        setTimeout(() => {
            if (this.pollingInterval) {
                this.handleTimeout();
            }
        }, CONFIG.POLLING_TIMEOUT);
    }
    
    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    /**
     * Check workflow status
     */
    async checkStatus() {
        try {
            const run = await this.githubAPIClient.getWorkflowRun(this.currentRunId);
            
            if (run) {
                const newStatus = run.status;
                
                // Update status if changed
                if (newStatus !== this.currentStatus) {
                    this.currentStatus = newStatus;
                    this.updateStatusDisplay(newStatus);
                    
                    if (this.onStatusChange) {
                        this.onStatusChange(newStatus, run);
                    }
                }
                
                // Check if completed
                if (newStatus === 'completed') {
                    this.stopPolling();
                    
                    if (this.onComplete) {
                        this.onComplete(newStatus, run);
                    }
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }
    
    /**
     * Update status display
     * @param {string} status - Workflow status
     */
    updateStatusDisplay(status) {
        if (this.elements && this.elements.statusIndicator) {
            const statusText = this.getStatusText(status);
            this.elements.statusIndicator.textContent = statusText;
            this.elements.statusIndicator.className = `status-indicator ${status}`;
        }
    }
    
    /**
     * Get status text
     * @param {string} status - Status code
     * @returns {string} Status text
     */
    getStatusText(status) {
        const statusMap = {
            'queued': 'Queued',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'failed': 'Failed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }
    
    /**
     * Handle timeout
     */
    handleTimeout() {
        this.stopPolling();
        this.updateStatusDisplay('failed');
        
        if (this.elements && this.elements.statusIndicator) {
            this.elements.statusIndicator.textContent = 'Timeout (30 minutes)';
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
}
