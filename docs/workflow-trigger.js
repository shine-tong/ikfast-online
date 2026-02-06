/**
 * WorkflowTriggerComponent - Triggers GitHub Actions workflows
 */

class WorkflowTriggerComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.isWorkflowActive = false;
        this.currentRunId = null;
        this.elements = null;
    }
    
    /**
     * Initialize UI elements
     * @param {Object} elements - DOM elements
     */
    initializeUI(elements) {
        this.elements = elements;
    }
    
    /**
     * Trigger workflow
     * @param {Object} inputs - Workflow inputs
     * @returns {Promise<Object>} Result with success flag and runId
     */
    async triggerWorkflow(inputs) {
        try {
            if (this.isWorkflowActive) {
                this.displayMessage('Workflow is already running', 'warning');
                return { success: false };
            }
            
            this.displayMessage('Triggering workflow...', 'info');
            
            const result = await this.githubAPIClient.triggerWorkflow(
                CONFIG.WORKFLOW_FILE,
                inputs
            );
            
            if (result.success) {
                this.isWorkflowActive = true;
                
                // Wait a moment for the run to appear
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Get the most recent run
                const runs = await this.githubAPIClient.listWorkflowRuns(CONFIG.WORKFLOW_FILE);
                const recentRun = runs && runs.length > 0 ? runs[0] : null;
                
                if (recentRun) {
                    this.currentRunId = recentRun.id;
                    this.displayMessage(`Workflow triggered (Run ID: ${recentRun.id})`, 'success');
                    
                    return {
                        success: true,
                        runId: recentRun.id
                    };
                } else {
                    this.displayMessage('Workflow triggered but cannot get Run ID', 'warning');
                    return { success: true };
                }
            } else {
                this.displayMessage('Workflow trigger failed', 'error');
                return { success: false };
            }
            
        } catch (error) {
            console.error('Workflow trigger error:', error);
            this.displayMessage(`Workflow trigger failed: ${error.message}`, 'error');
            return { success: false };
        }
    }
    
    /**
     * Display message
     * @param {string} message - Message to display
     * @param {string} type - Message type
     */
    displayMessage(message, type = 'info') {
        if (this.elements && this.elements.statusMessage) {
            this.elements.statusMessage.textContent = message;
            this.elements.statusMessage.className = `status-message ${type}`;
        }
        console.log(`[${type}] ${message}`);
    }
    
    /**
     * Set workflow active state
     * @param {boolean} active - Whether workflow is active
     * @param {number} runId - Run ID
     */
    setWorkflowActive(active, runId = null) {
        this.isWorkflowActive = active;
        this.currentRunId = runId;
    }
    
    /**
     * Get workflow state
     * @returns {Object} Workflow state
     */
    getWorkflowState() {
        return {
            isActive: this.isWorkflowActive,
            runId: this.currentRunId
        };
    }
}
