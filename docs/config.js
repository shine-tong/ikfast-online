/**
 * Configuration constants for IKFast Online Generator
 */

const CONFIG = {
    // GitHub Repository Configuration
    REPO_OWNER: 'shine-tong',  // TODO: Replace with your GitHub username
    REPO_NAME: 'ikfast-online',  // TODO: Replace with your repository name
    
    // GitHub Actions Workflow
    WORKFLOW_FILE: 'ikfast.yml',
    WORKFLOW_ID: 'ikfast.yml',  // Can also use workflow ID number
    
    // API Configuration
    GITHUB_API_BASE: 'https://api.github.com',
    GITHUB_API_VERSION: '2022-11-28',
    
    // Polling Configuration
    POLLING_INTERVAL: 5000,  // 5 seconds (minimum interval to respect API rate limits)
    POLLING_MAX_INTERVAL: 30000,  // 30 seconds (maximum interval with exponential backoff)
    POLLING_TIMEOUT: 1800000,  // 30 minutes (workflow timeout)
    
    // File Upload Configuration
    MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB in bytes
    ALLOWED_EXTENSIONS: ['.urdf'],
    
    // Workflow Configuration
    DEFAULT_IKTYPE: 'transform6d',
    IKTYPE_OPTIONS: [
        {
            value: 'transform6d',
            label: '6D Transform (榛樿)',
            description: '瀹屾暣鐨勪綅缃拰濮挎€?
        },
        {
            value: 'translation3d',
            label: '3D Translation',
            description: '浠呬綅缃紝鏃犲Э鎬佺害鏉?
        },
        {
            value: 'direction3d',
            label: '3D Direction',
            description: '鏂瑰悜鍚戦噺'
        },
        {
            value: 'ray4d',
            label: '4D Ray',
            description: '灏勭嚎锛堝師鐐?鏂瑰悜锛?
        },
        {
            value: 'lookat3d',
            label: '3D Look-At',
            description: '娉ㄨ鐐?
        },
        {
            value: 'translationdirection5d',
            label: '5D Translation+Direction',
            description: '浣嶇疆+鏂瑰悜'
        },
        {
            value: 'translationxy5d',
            label: '5D Translation XY',
            description: 'XY骞抽潰浣嶇疆+濮挎€?
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
    LOG_MAX_LINES: 10000,  // Maximum lines to display in log viewer
    
    // Error Messages
    ERROR_MESSAGES: {
        INVALID_FILE_EXTENSION: '鏂囦欢鎵╁睍鍚嶅繀椤讳负 .urdf',
        FILE_TOO_LARGE: '鏂囦欢澶у皬瓒呰繃 10MB 闄愬埗',
        INVALID_XML: '鏂囦欢涓嶆槸鏈夋晥鐨?XML 鏍煎紡',
        NETWORK_ERROR: '缃戠粶杩炴帴澶辫触锛岃妫€鏌ョ綉缁滃悗閲嶈瘯',
        AUTH_FAILED: '璁よ瘉澶辫触锛岃妫€鏌?Token 鏉冮檺',
        PERMISSION_DENIED: '鏉冮檺涓嶈冻鎴?API 閫熺巼闄愬埗',
        RESOURCE_NOT_FOUND: '璧勬簮鏈壘鍒帮紝璇锋鏌ヤ粨搴撻厤缃?,
        INVALID_PARAMETERS: '鍙傛暟楠岃瘉澶辫触锛岃妫€鏌ヨ緭鍏?,
        WORKFLOW_TIMEOUT: '宸ヤ綔娴佹墽琛岃秴鏃讹紙30鍒嗛挓锛?,
        ARTIFACT_NOT_FOUND: 'Artifact 鏈壘鍒帮紝宸ヤ綔娴佸彲鑳芥湭鎴愬姛瀹屾垚',
        UNKNOWN_ERROR: '鍙戠敓鏈煡閿欒锛岃鏌ョ湅鎺у埗鍙版棩蹇?
    },
    
    // Status Messages
    STATUS_MESSAGES: {
        NOT_STARTED: '鏈紑濮?,
        QUEUED: '鎺掗槦涓?,
        IN_PROGRESS: '鎵ц涓?,
        COMPLETED: '宸插畬鎴?,
        FAILED: '澶辫触',
        CANCELLED: '宸插彇娑?
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
    QUOTA_WARNING_THRESHOLD: 0.8  // Warn when 80% of quota is used
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
