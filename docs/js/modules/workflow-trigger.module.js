﻿/**
 * WorkflowTriggerComponent - Handles GitHub Actions workflow triggering
 * ES Module version for testing
 */

import { CONFIG } from '../config.js';

export class WorkflowTriggerComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.elements = null;
        this.isWorkflowActive = false;
        this.currentRunId = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the workflow trigger UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set up event listeners
        if (elements.submitButton) {
            elements.submitButton.addEventListener('click', () => this.handleSubmit());
        }
        
        // Initialize UI state
        this.updateUIState();
    }
    
    /**
     * Handle submit button click
     */
    async handleSubmit() {
        if (this.isWorkflowActive) {
            this.displayMessage('Workflow is running, please wait for completion', 'warning');
            return;
        }
        
        // This will be called by the main application with parameters
        // The actual triggering is done via triggerWorkflow method
    }
    
    /**
     * Trigger a workflow with parameters
     * @param {Object} parameters - Workflow parameters
     * @param {string} parameters.mode - Workflow mode ('info' or 'generate')
     * @param {number} [parameters.baseLink] - Base link index (required for generate mode)
     * @param {number} [parameters.eeLink] - End effector link index (required for generate mode)
     * @param {string} [parameters.ikType] - IK solver type (required for generate mode)
     * @returns {Promise<{success: boolean, runId?: number}>}
     */
    async triggerWorkflow(parameters) {
        try {
            // Check if there's already an active workflow
            const hasActive = await this.checkActiveWorkflow();
            
            if (hasActive) {
                this.displayMessage('Workflow is running, please wait for completion', 'warning');
                return { success: false };
            }
            
            // Prepare workflow inputs
            const inputs = {
                mode: parameters.mode
            };
            
            // Add parameters for generate mode
            if (parameters.mode === 'generate') {
                if (parameters.baseLink === undefined || parameters.eeLink === undefined) {
                    throw new Error('Generate mode requires baseLink and eeLink parameters');
                }
                
                inputs.base_link = String(parameters.baseLink);
                inputs.ee_link = String(parameters.eeLink);
                inputs.iktype = parameters.ikType || 'transform6d';
            }
            
            // Trigger the workflow
            this.displayMessage('Triggering workflow...', 'info');
            
            const result = await this.githubAPIClient.triggerWorkflow(
                CONFIG.WORKFLOW_FILE,
                inputs,
                CONFIG.REPO_BRANCH
            );
            
            if (result.success) {
                this.isWorkflowActive = true;
                
                // Get the most recent workflow run to get the run ID
                // Wait a bit for the workflow to be created
                await this.sleep(2000);
                
                const recentRun = await this.githubAPIClient.getMostRecentWorkflowRun(CONFIG.WORKFLOW_FILE);
                
                if (recentRun) {
                    this.currentRunId = recentRun.id;
                    this.displayMessage(`Workflow triggered (Run ID: ${recentRun.id})`, 'success');
                    
                    return {
                        success: true,
                        runId: recentRun.id
                    };
                } else {
                    this.displayMessage('Workflow triggered, but unable to get Run ID', 'warning');
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
     * Check if there are any active workflows
     * @returns {Promise<boolean>} True if there are active workflows
     */
    async checkActiveWorkflow() {
        try {
            const hasActive = await this.githubAPIClient.hasActiveWorkflow(CONFIG.WORKFLOW_FILE);
            this.isWorkflowActive = hasActive;
            this.updateUIState();
            return hasActive;
        } catch (error) {
            console.error('Error checking active workflow:', error);
            return false;
        }
    }
    
    /**
     * Set workflow active state
     * @param {boolean} isActive - Whether a workflow is active
     * @param {number|null} runId - Current run ID
     */
    setWorkflowActive(isActive, runId = null) {
        this.isWorkflowActive = isActive;
        this.currentRunId = runId;
        this.updateUIState();
    }
    
    /**
     * Get current workflow state
     * @returns {{isActive: boolean, runId: number|null}}
     */
    getWorkflowState() {
        return {
            isActive: this.isWorkflowActive,
            runId: this.currentRunId
        };
    }
    
    /**
     * Display a message to the user
     * @param {string} message - Message to display
     * @param {string} type - Message type ('info', 'success', 'warning', 'error')
     */
    displayMessage(message, type = 'info') {
        if (this.elements && this.elements.statusMessage) {
            this.elements.statusMessage.textContent = message;
            this.elements.statusMessage.className = `status-message ${type}`;
            this.elements.statusMessage.style.display = 'block';
        }
    }
    
    /**
     * Clear the status message
     */
    clearMessage() {
        if (this.elements && this.elements.statusMessage) {
            this.elements.statusMessage.textContent = '';
            this.elements.statusMessage.style.display = 'none';
        }
    }
    
    /**
     * Update UI state based on workflow status
     */
    updateUIState() {
        if (this.elements && this.elements.submitButton) {
            if (this.isWorkflowActive) {
                this.elements.submitButton.disabled = true;
                this.elements.submitButton.textContent = 'Workflow executing...';
            } else {
                this.elements.submitButton.disabled = false;
                this.elements.submitButton.textContent = 'Generate IKFast Solver';
            }
        }
    }
    
    /**
     * Reset the component state
     */
    reset() {
        this.isWorkflowActive = false;
        this.currentRunId = null;
        this.clearMessage();
        this.updateUIState();
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
