/**
 * Configuration constants for IKFast Online Generator
 */

const CONFIG = {
    // GitHub Repository Configuration
    REPO_OWNER: 'shine-tong',
    REPO_NAME: 'ikfast-online',
    
    // GitHub Actions Workflow
    WORKFLOW_FILE: 'ikfast.yml',
    WORKFLOW_ID: 'ikfast.yml',
    
    // API Configuration
    GITHUB_API_BASE: 'https://api.github.com',
    GITHUB_API_VERSION: '2022-11-28',
    
    // Polling Configuration
    POLLING_INTERVAL: 5000,
    POLLING_MAX_INTERVAL: 30000,
    POLLING_TIMEOUT: 1800000,
    
    // File Upload Configuration
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['.urdf'],
    
    // Workflow Configuration
    DEFAULT_IKTYPE: 'transform6d',
    IKTYPE_OPTIONS: [
        {
            value: 'transform6d',
            label: '6D Transform (Default)',
            description: 'Full position and orientation'
        },
        {
            value: 'translation3d',
            label: '3D Translation',
            description: 'Position only, no orientation'
        },
        {
            value: 'direction3d',
            label: '3D Direction',
            description: 'Direction vector'
        },
        {
            value: 'ray4d',
            label: '4D Ray',
            description: 'Ray (origin + direction)'
        },
        {
            value: 'lookat3d',
            label: '3D Look-At',
            description: 'Look-at point'
        },
        {
            value: 'translationdirection5d',
            label: '5D Translation+Direction',
            description: 'Position + direction'
        },
        {
            value: 'translationxy5d',
            label: '5D Translation XY',
            description: 'XY plane position + orientation'
        }
    ],
    
    // Alias for IK_TYPES (for compatibility)
    get IK_TYPES() {
        return this.IKTYPE_OPTIONS;
    },
    
    // File Paths
    URDF_PATH: 'jobs/current/robot.urdf',
    OUTPUT_DIR: 'outputs/',
    
    // Artifact Configuration
    ARTIFACT_NAME: 'ikfast-result',
    ARTIFACT_RETENTION_DAYS: 7,
    
    // UI Configuration
    AUTO_SCROLL_LOGS: true,
    LOG_MAX_LINES: 10000,
    
    // Error Messages
    ERROR_MESSAGES: {
        INVALID_FILE_EXTENSION: 'File extension must be .urdf',
        FILE_TOO_LARGE: 'File size exceeds 10MB limit',
        INVALID_XML: 'File is not valid XML format',
        NETWORK_ERROR: 'Network connection failed',
        AUTH_FAILED: 'Authentication failed, check token permissions',
        PERMISSION_DENIED: 'Permission denied or API rate limit',
        RESOURCE_NOT_FOUND: 'Resource not found, check repository config',
        INVALID_PARAMETERS: 'Parameter validation failed',
        WORKFLOW_TIMEOUT: 'Workflow execution timeout (30 minutes)',
        ARTIFACT_NOT_FOUND: 'Artifact not found, workflow may not have completed',
        UNKNOWN_ERROR: 'Unknown error occurred'
    },
    
    // Status Messages
    STATUS_MESSAGES: {
        NOT_STARTED: 'Not Started',
        QUEUED: 'Queued',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
        CANCELLED: 'Cancelled'
    },
    
    // GitHub API Endpoints
    API_ENDPOINTS: {
        UPLOAD_FILE: '/repos/{owner}/{repo}/contents/{path}',
        TRIGGER_WORKFLOW: '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
        GET_WORKFLOW_RUN: '/repos/{owner}/{repo}/actions/runs/{run_id}',
        LIST_WORKFLOW_RUNS: '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs',
        LIST_ARTIFACTS: '/repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
        DOWNLOAD_ARTIFACT: '/repos/{owner}/{repo}/actions/artifacts/{artifact_id}/zip',
        GET_WORKFLOW_LOGS: '/repos/{owner}/{repo}/actions/runs/{run_id}/logs',
        VALIDATE_TOKEN: '/user',
        GET_BILLING_ACTIONS: '/repos/{owner}/{repo}/actions/billing/usage'
    },
    
    // Quota Warning Threshold
    QUOTA_WARNING_THRESHOLD: 0.8
};

// Freeze configuration to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.IKTYPE_OPTIONS);
Object.freeze(CONFIG.ERROR_MESSAGES);
Object.freeze(CONFIG.STATUS_MESSAGES);
Object.freeze(CONFIG.API_ENDPOINTS);

// Make CONFIG available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// Export for ES6 modules
export { CONFIG };
