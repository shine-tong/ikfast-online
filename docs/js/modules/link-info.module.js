/**
 * LinkInfoComponent - Handles robot link information extraction and display
 * Parses OpenRAVE link output and provides UI for link selection
 * ES Module version for testing
 */

import { CONFIG } from '../config.js';

export class LinkInfoComponent {
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
        this.links = [];
        this.elements = null;
        this.isLoading = false;
        this.currentRunId = null;
    }
    
    /**
     * Initialize the component with DOM elements
     * @param {Object} elements - DOM elements for the link info UI
     */
    initializeUI(elements) {
        this.elements = elements;
        
        // Set up event listeners
        if (elements.fetchButton) {
            elements.fetchButton.addEventListener('click', () => this.fetchLinkInfo());
        }
        
        // Listen for file upload events to auto-trigger link info fetch
        window.addEventListener('fileUploaded', () => {
            this.autoFetchLinkInfo();
        });
        
        // Initialize UI state
        this.updateUIState();
    }
    
    /**
     * Automatically fetch link info after file upload
     * @private
     */
    async autoFetchLinkInfo() {
        // Wait a moment for the file to be committed
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.fetchLinkInfo();
    }
    
    /**
     * Fetch link information by triggering info mode workflow
     * @returns {Promise<void>}
     */
    async fetchLinkInfo() {
        if (this.isLoading) {
            return;
        }
        
        try {
            this.isLoading = true;
            this.showLoading(true);
            this.clearError();
            
            // Trigger workflow in info mode
            const result = await this.githubAPIClient.triggerWorkflow(
                CONFIG.WORKFLOW_FILE,
                { mode: 'info' },
                'main'
            );
            
            if (!result.success) {
                throw new Error('Failed to trigger workflow');
            }
            
            // Wait a moment for workflow to be created
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Get the most recent workflow run
            const recentRun = await this.githubAPIClient.getMostRecentWorkflowRun(CONFIG.WORKFLOW_FILE);
            
            if (!recentRun) {
                throw new Error('Could not find workflow run');
            }
            
            this.currentRunId = recentRun.id;
            
            // Poll for workflow completion
            await this.pollWorkflowCompletion(recentRun.id);
            
        } catch (error) {
            console.error('Error fetching link info:', error);
            this.showError(error.message || 'Failed to fetch link information');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    /**
     * Poll workflow until completion
     * @param {number} runId - Workflow run ID
     * @private
     */
    async pollWorkflowCompletion(runId) {
        const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const run = await this.githubAPIClient.getWorkflowRun(runId);
            
            if (run.status === 'completed') {
                if (run.conclusion === 'success') {
                    // Workflow completed successfully, fetch the logs
                    await this.fetchAndParseLogs(runId);
                    return;
                } else {
                    throw new Error(`Workflow failed with conclusion: ${run.conclusion}`);
                }
            }
            
            // Update status display
            this.updateStatusDisplay(run.status);
            
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, CONFIG.POLLING_INTERVAL));
            attempts++;
        }
        
        throw new Error('Workflow polling timeout');
    }
    
    /**
     * Fetch and parse workflow logs to extract link information
     * @param {number} runId - Workflow run ID
     * @private
     */
    async fetchAndParseLogs(runId) {
        try {
            // Get artifacts from the workflow run
            const artifacts = await this.githubAPIClient.listArtifacts(runId);
            
            // Find the ikfast-result artifact
            const resultArtifact = artifacts.find(a => a.name === CONFIG.ARTIFACT_NAME);
            
            if (!resultArtifact) {
                throw new Error('Link info artifact not found');
            }
            
            // Download the artifact
            const artifactBlob = await this.githubAPIClient.downloadArtifact(resultArtifact.id);
            
            // Extract info.log from the ZIP
            const logContent = await this.extractLogFromZip(artifactBlob, 'info.log');
            
            // Parse link information
            const links = this.parseLinkInfo(logContent);
            
            if (links.length === 0) {
                throw new Error('No link information found in logs');
            }
            
            this.links = links;
            this.renderLinkTable(links);
            
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(`Failed to parse link information: ${error.message}`);
        }
    }
    
    /**
     * Extract a file from a ZIP blob
     * @param {Blob} zipBlob - ZIP file as Blob
     * @param {string} filename - File to extract
     * @returns {Promise<string>} File content
     * @private
     */
    async extractLogFromZip(zipBlob, filename) {
        // For browser environment, we need to use a ZIP library
        // For now, we'll use a simple approach with JSZip if available
        // Otherwise, we'll try to get logs directly from the API
        
        try {
            // Try to use JSZip if available
            if (typeof JSZip !== 'undefined') {
                const zip = new JSZip();
                const zipData = await zip.loadAsync(zipBlob);
                const file = zipData.file(filename);
                
                if (!file) {
                    throw new Error(`File ${filename} not found in artifact`);
                }
                
                return await file.async('string');
            } else {
                // Fallback: try to get workflow logs directly
                const logsBlob = await this.githubAPIClient.getWorkflowLogs(this.currentRunId);
                return await logsBlob.text();
            }
        } catch (error) {
            console.error('Error extracting log from ZIP:', error);
            throw error;
        }
    }
    
    /**
     * Parse link information from OpenRAVE output
     * @param {string} logContent - Log content containing link information
     * @returns {Array<Object>} Array of link objects
     */
    parseLinkInfo(logContent) {
        const links = [];
        const lines = logContent.split('\n');
        
        // Find the section with link information
        // Looking for output from "openrave-robot.py robot.dae --info links"
        let inLinkSection = false;
        let headerFound = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Detect start of link info section
            if (trimmedLine.includes('--info links') || trimmedLine.includes('Extract Link Information')) {
                inLinkSection = true;
                continue;
            }
            
            // Look for header line: "name index parents"
            if (inLinkSection && !headerFound && trimmedLine.match(/^name\s+index\s+parent/i)) {
                headerFound = true;
                continue;
            }
            
            // Parse link lines after header
            if (inLinkSection && headerFound && trimmedLine.length > 0) {
                // Stop at next STEP marker or empty section
                if (trimmedLine.startsWith('===') || trimmedLine.startsWith('STEP')) {
                    break;
                }
                
                // Parse link line: "link_name index parent_info"
                // Example: "base_link 0 "
                // Example: "link1 1 base_link(0)"
                const match = trimmedLine.match(/^(\S+)\s+(\d+)\s*(.*?)$/);
                
                if (match) {
                    const name = match[1];
                    const index = parseInt(match[2], 10);
                    const parentInfo = match[3].trim();
                    
                    // Extract parent name from parentInfo (e.g., "base_link(0)" -> "base_link")
                    let parent = null;
                    if (parentInfo && parentInfo.length > 0) {
                        const parentMatch = parentInfo.match(/^(\S+)\(/);
                        if (parentMatch) {
                            parent = parentMatch[1];
                        }
                    }
                    
                    links.push({
                        name: name,
                        index: index,
                        parent: parent
                    });
                }
            }
        }
        
        // Calculate isRoot and isLeaf properties
        return this.enrichLinkData(links);
    }
    
    /**
     * Enrich link data with isRoot and isLeaf properties
     * @param {Array<Object>} links - Array of link objects
     * @returns {Array<Object>} Enriched link objects
     * @private
     */
    enrichLinkData(links) {
        // Build a map of link names to their children
        const childrenMap = new Map();
        
        for (const link of links) {
            if (link.parent) {
                if (!childrenMap.has(link.parent)) {
                    childrenMap.set(link.parent, []);
                }
                childrenMap.get(link.parent).push(link.name);
            }
        }
        
        // Enrich each link
        return links.map(link => ({
            ...link,
            isRoot: link.parent === null,
            isLeaf: !childrenMap.has(link.name) || childrenMap.get(link.name).length === 0
        }));
    }
    
    /**
     * Render link table in the UI
     * @param {Array<Object>} links - Array of link objects
     */
    renderLinkTable(links) {
        if (!this.elements || !this.elements.linkTable) {
            console.error('Link table element not found');
            return;
        }
        
        // Clear existing table content
        this.elements.linkTable.innerHTML = '';
        
        // Create table
        const table = document.createElement('table');
        table.className = 'link-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Index', 'Name', 'Parent'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        links.forEach(link => {
            const row = document.createElement('tr');
            row.className = 'link-row';
            
            // Add special classes for root and leaf links
            if (link.isRoot) {
                row.classList.add('root-link');
            }
            if (link.isLeaf) {
                row.classList.add('leaf-link');
            }
            
            // Make row clickable
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => this.handleLinkSelect(link));
            
            // Index cell
            const indexCell = document.createElement('td');
            indexCell.textContent = String(link.index);
            indexCell.className = 'link-index';
            row.appendChild(indexCell);
            
            // Name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = link.name;
            nameCell.className = 'link-name';
            row.appendChild(nameCell);
            
            // Parent cell
            const parentCell = document.createElement('td');
            parentCell.textContent = link.parent || '(none)';
            parentCell.className = 'link-parent';
            if (!link.parent) {
                parentCell.style.fontStyle = 'italic';
                parentCell.style.color = '#999';
            }
            row.appendChild(parentCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        this.elements.linkTable.appendChild(table);
        
        // Show the table container
        if (this.elements.linkTableContainer) {
            this.elements.linkTableContainer.style.display = 'block';
        }
        
        // Add legend
        this.renderLegend();
    }
    
    /**
     * Render legend explaining link highlighting
     * @private
     */
    renderLegend() {
        if (!this.elements || !this.elements.linkTable) {
            return;
        }
        
        // Check if legend already exists
        let legend = this.elements.linkTable.querySelector('.link-legend');
        
        if (!legend) {
            legend = document.createElement('div');
            legend.className = 'link-legend';
            legend.innerHTML = `
                <div class="legend-item">
                    <span class="legend-color root-link-color"></span>
                    <span>Root Link (no parent) - Suitable as Base Link</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color leaf-link-color"></span>
                    <span>Leaf Link (no children) - Suitable as End Effector Link</span>
                </div>
            `;
            this.elements.linkTable.appendChild(legend);
        }
    }
    
    /**
     * Handle link selection (click on row)
     * @param {Object} link - Selected link object
     */
    handleLinkSelect(link) {
        // Dispatch custom event with link data
        window.dispatchEvent(new CustomEvent('linkSelected', {
            detail: {
                link: link,
                index: link.index,
                name: link.name,
                isRoot: link.isRoot,
                isLeaf: link.isLeaf
            }
        }));
        
        // Visual feedback
        this.highlightSelectedRow(link.index);
    }
    
    /**
     * Highlight the selected row
     * @param {number} linkIndex - Index of the selected link
     * @private
     */
    highlightSelectedRow(linkIndex) {
        if (!this.elements || !this.elements.linkTable) {
            return;
        }
        
        // Remove previous selection
        const previouslySelected = this.elements.linkTable.querySelectorAll('.selected');
        previouslySelected.forEach(row => row.classList.remove('selected'));
        
        // Add selection to clicked row
        const rows = this.elements.linkTable.querySelectorAll('.link-row');
        rows.forEach(row => {
            const indexCell = row.querySelector('.link-index');
            if (indexCell && parseInt(indexCell.textContent) === linkIndex) {
                row.classList.add('selected');
            }
        });
    }
    
    /**
     * Show loading indicator
     * @param {boolean} show - Whether to show or hide loading
     * @private
     */
    showLoading(show) {
        if (this.elements && this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = show ? 'block' : 'none';
        }
        
        if (this.elements && this.elements.fetchButton) {
            this.elements.fetchButton.disabled = show;
            this.elements.fetchButton.textContent = show ? 'Fetching...' : 'Fetch Link Info';
        }
    }
    
    /**
     * Update status display during workflow execution
     * @param {string} status - Workflow status
     * @private
     */
    updateStatusDisplay(status) {
        if (this.elements && this.elements.statusDisplay) {
            const statusText = CONFIG.STATUS_MESSAGES[status.toUpperCase()] || status;
            this.elements.statusDisplay.textContent = `Status: ${statusText}`;
            this.elements.statusDisplay.style.display = 'block';
        }
    }
    
    /**
     * Update UI state
     * @private
     */
    updateUIState() {
        if (!this.elements) return;
        
        // Update button state based on loading
        if (this.elements.fetchButton) {
            this.elements.fetchButton.disabled = this.isLoading;
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
            this.elements.errorDisplay.className = 'link-message error';
        } else {
            console.error('Link Info Error:', message);
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
     * Get the current links
     * @returns {Array<Object>} Array of link objects
     */
    getLinks() {
        return this.links;
    }
    
    /**
     * Get a link by index
     * @param {number} index - Link index
     * @returns {Object|null} Link object or null if not found
     */
    getLinkByIndex(index) {
        return this.links.find(link => link.index === index) || null;
    }
    
    /**
     * Get a link by name
     * @param {string} name - Link name
     * @returns {Object|null} Link object or null if not found
     */
    getLinkByName(name) {
        return this.links.find(link => link.name === name) || null;
    }
}
