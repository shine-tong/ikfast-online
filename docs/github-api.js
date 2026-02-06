/**
 * GitHubAPIClient - Client for interacting with GitHub REST API
 * Handles file uploads, workflow triggers, status monitoring, and artifact downloads
 */

class GitHubAPIClient {
    constructor(authManager) {
        this.authManager = authManager;
        this.baseURL = CONFIG.GITHUB_API_BASE;
        this.apiVersion = CONFIG.GITHUB_API_VERSION;
    }
    
    /**
     * Make a base request to GitHub API with authentication
     * @param {string} endpoint - API endpoint (relative to base URL)
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     * @private
     */
    async _makeRequest(endpoint, options = {}) {
        const token = this.authManager.getToken();
        
        if (!token) {
            throw new GitHubAPIError('Not authenticated', 401, 'No authentication token available');
        }
        
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': this.apiVersion,
            ...options.headers
        };
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Handle different error status codes
            if (!response.ok) {
                await this._handleErrorResponse(response);
            }
            
            return response;
        } catch (error) {
            if (error instanceof GitHubAPIError) {
                throw error;
            }
            throw new NetworkError('Network request failed', 0, error.message);
        }
    }
    
    /**
     * Handle error responses from GitHub API
     * @param {Response} response - The error response
     * @private
     */
    async _handleErrorResponse(response) {
        let errorMessage = '';
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || 'Unknown error';
        } catch (e) {
            errorMessage = response.statusText || 'Unknown error';
        }
        
        switch (response.status) {
            case 401:
                throw new GitHubAPIError(
                    'Authentication failed',
                    401,
                    errorMessage || 'Invalid or expired token'
                );
            case 403:
                throw new GitHubAPIError(
                    'Permission denied',
                    403,
                    errorMessage || 'Insufficient permissions or rate limit exceeded'
                );
            case 404:
                throw new GitHubAPIError(
                    'Resource not found',
                    404,
                    errorMessage || 'The requested resource was not found'
                );
            case 422:
                throw new GitHubAPIError(
                    'Validation failed',
                    422,
                    errorMessage || 'Invalid request parameters'
                );
            default:
                if (response.status >= 500) {
                    throw new GitHubAPIError(
                        'Server error',
                        response.status,
                        errorMessage || 'GitHub server error'
                    );
                }
                throw new GitHubAPIError(
                    'API error',
                    response.status,
                    errorMessage
                );
        }
    }
    
    /**
     * Get file content from repository
     * @param {string} path - File path in repository
     * @returns {Promise<{sha: string, content: string, size: number}|null>} File info or null if not found
     */
    async getFile(path) {
        const endpoint = CONFIG.API_ENDPOINTS.UPLOAD_FILE
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{path}', path);
        
        try {
            const response = await this._makeRequest(endpoint, {
                method: 'GET'
            });
            
            const data = await response.json();
            
            return {
                sha: data.sha,
                content: data.content,
                size: data.size,
                encoding: data.encoding
            };
        } catch (error) {
            // If file doesn't exist (404), return null
            if (error instanceof GitHubAPIError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    
    /**
     * Upload a file to the repository
     * @param {string} path - File path in repository (e.g., 'jobs/current/robot.urdf')
     * @param {string} content - File content (will be base64 encoded)
     * @param {string} message - Commit message
     * @param {string|null} sha - SHA of existing file (for updates)
     * @returns {Promise<{success: boolean, sha: string, content: Object}>}
     */
    async uploadFile(path, content, message = 'Upload file', sha = null) {
        const endpoint = CONFIG.API_ENDPOINTS.UPLOAD_FILE
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{path}', path);
        
        // Base64 encode the content
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        
        const body = {
            message: message,
            content: base64Content
        };
        
        // Include SHA if updating existing file
        if (sha) {
            body.sha = sha;
        }
        
        const response = await this._makeRequest(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        return {
            success: true,
            sha: data.content.sha,
            content: data.content
        };
    }
    
    /**
     * Trigger a workflow
     * @param {string} workflowId - Workflow file name or ID
     * @param {Object} inputs - Workflow inputs
     * @param {string} ref - Git ref (branch/tag)
     * @returns {Promise<{success: boolean}>}
     */
    async triggerWorkflow(workflowId, inputs = {}, ref = 'main') {
        const endpoint = CONFIG.API_ENDPOINTS.TRIGGER_WORKFLOW
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{workflow_id}', workflowId);
        
        const response = await this._makeRequest(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: ref,
                inputs: inputs
            })
        });
        
        // 204 No Content indicates success
        return {
            success: response.status === 204
        };
    }
    
    /**
     * Get workflow run details
     * @param {number} runId - Workflow run ID
     * @returns {Promise<Object>} Workflow run details
     */
    async getWorkflowRun(runId) {
        const endpoint = CONFIG.API_ENDPOINTS.GET_WORKFLOW_RUN
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{run_id}', runId);
        
        const response = await this._makeRequest(endpoint, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        return {
            id: data.id,
            name: data.name,
            status: data.status,
            conclusion: data.conclusion,
            workflowId: data.workflow_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            htmlUrl: data.html_url,
            runNumber: data.run_number,
            event: data.event
        };
    }
    
    /**
     * List workflow runs for a specific workflow
     * @param {string} workflowId - Workflow file name or ID
     * @param {number} perPage - Number of results per page
     * @returns {Promise<Array>} List of workflow runs
     */
    async listWorkflowRuns(workflowId, perPage = 10) {
        const endpoint = CONFIG.API_ENDPOINTS.LIST_WORKFLOW_RUNS
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{workflow_id}', workflowId);
        
        const response = await this._makeRequest(endpoint + `?per_page=${perPage}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        return data.workflow_runs.map(run => ({
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            htmlUrl: run.html_url
        }));
    }
    
    /**
     * List artifacts for a workflow run
     * @param {number} runId - Workflow run ID
     * @returns {Promise<Array>} List of artifacts
     */
    async listArtifacts(runId) {
        const endpoint = CONFIG.API_ENDPOINTS.LIST_ARTIFACTS
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{run_id}', runId);
        
        const response = await this._makeRequest(endpoint, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        return data.artifacts.map(artifact => ({
            id: artifact.id,
            name: artifact.name,
            sizeInBytes: artifact.size_in_bytes,
            url: artifact.url,
            archiveDownloadUrl: artifact.archive_download_url,
            expired: artifact.expired,
            createdAt: artifact.created_at,
            expiresAt: artifact.expires_at
        }));
    }
    
    /**
     * Download an artifact
     * @param {number} artifactId - Artifact ID
     * @returns {Promise<Blob>} Artifact content as Blob (ZIP file)
     */
    async downloadArtifact(artifactId) {
        const endpoint = CONFIG.API_ENDPOINTS.DOWNLOAD_ARTIFACT
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{artifact_id}', artifactId);
        
        const response = await this._makeRequest(endpoint, {
            method: 'GET'
        });
        
        // Return as Blob for download
        return await response.blob();
    }
    
    /**
     * Get workflow logs
     * @param {number} runId - Workflow run ID
     * @returns {Promise<Blob>} Logs as Blob (ZIP file)
     */
    async getWorkflowLogs(runId) {
        const endpoint = CONFIG.API_ENDPOINTS.GET_WORKFLOW_LOGS
            .replace('{owner}', CONFIG.REPO_OWNER)
            .replace('{repo}', CONFIG.REPO_NAME)
            .replace('{run_id}', runId);
        
        const response = await this._makeRequest(endpoint, {
            method: 'GET'
        });
        
        return await response.blob();
    }
    
    /**
     * Check if there are any active workflows
     * @param {string} workflowId - Workflow file name or ID
     * @returns {Promise<boolean>} True if there are active workflows
     */
    async hasActiveWorkflow(workflowId) {
        const runs = await this.listWorkflowRuns(workflowId, 5);
        
        return runs.some(run => 
            run.status === 'queued' || 
            run.status === 'in_progress'
        );
    }
    
    /**
     * Get the most recent workflow run
     * @param {string} workflowId - Workflow file name or ID
     * @returns {Promise<Object|null>} Most recent workflow run or null
     */
    async getMostRecentWorkflowRun(workflowId) {
        const runs = await this.listWorkflowRuns(workflowId, 1);
        
        return runs.length > 0 ? runs[0] : null;
    }
    
    /**
     * Get GitHub Actions billing usage for the repository
     * Note: This endpoint requires admin access to the repository
     * @returns {Promise<{totalMinutesUsed: number, includedMinutes: number, percentUsed: number}|null>}
     */
    async getActionsBillingUsage() {
        try {
            const endpoint = CONFIG.API_ENDPOINTS.GET_BILLING_ACTIONS
                .replace('{owner}', CONFIG.REPO_OWNER)
                .replace('{repo}', CONFIG.REPO_NAME);
            
            const response = await this._makeRequest(endpoint, {
                method: 'GET'
            });
            
            const data = await response.json();
            
            // Calculate percentage used
            const totalMinutesUsed = data.total_minutes_used || 0;
            const includedMinutes = data.included_minutes || 2000; // Default for free tier
            const percentUsed = includedMinutes > 0 ? totalMinutesUsed / includedMinutes : 0;
            
            return {
                totalMinutesUsed,
                includedMinutes,
                percentUsed,
                totalPaidMinutesUsed: data.total_paid_minutes_used || 0
            };
        } catch (error) {
            // If we don't have permission to access billing info, return null
            if (error instanceof GitHubAPIError && (error.statusCode === 403 || error.statusCode === 404)) {
                console.warn('Unable to access billing information - requires admin access');
                return null;
            }
            throw error;
        }
    }
    
    /**
     * Check if quota warning should be displayed
     * @returns {Promise<{shouldWarn: boolean, percentUsed: number, message: string}|null>}
     */
    async checkQuotaWarning() {
        const usage = await this.getActionsBillingUsage();
        
        if (!usage) {
            // Can't check quota without billing access
            return null;
        }
        
        const shouldWarn = usage.percentUsed >= CONFIG.QUOTA_WARNING_THRESHOLD;
        
        return {
            shouldWarn,
            percentUsed: usage.percentUsed,
            totalMinutesUsed: usage.totalMinutesUsed,
            includedMinutes: usage.includedMinutes,
            message: shouldWarn 
                ? `璀﹀憡: GitHub Actions 閰嶉宸蹭娇鐢?${Math.round(usage.percentUsed * 100)}% (${usage.totalMinutesUsed}/${usage.includedMinutes} 鍒嗛挓)`
                : ''
        };
    }
}

/**
 * Custom error classes for better error handling
 */

class NetworkError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
        this.response = response;
    }
}

class GitHubAPIError extends Error {
    constructor(message, statusCode, apiMessage) {
        super(message);
        this.name = 'GitHubAPIError';
        this.statusCode = statusCode;
        this.apiMessage = apiMessage;
    }
}

class ValidationError extends Error {
    constructor(message, field, value) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}
