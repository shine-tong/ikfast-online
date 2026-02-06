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
            label: '6D Transform (默认)',
            description: '完整的位置和姿态'
        },
        {
            value: 'translation3d',
            label: '3D Translation',
            description: '仅位置，无姿态约束'
        },
        {
            value: 'direction3d',
            label: '3D Direction',
            description: '方向向量'
        },
        {
            value: 'ray4d',
            label: '4D Ray',
            description: '射线（原点+方向）'
        },
        {
            value: 'lookat3d',
            label: '3D Look-At',
            description: '注视点'
        },
        {
            value: 'translationdirection5d',
            label: '5D Translation+Direction',
            description: '位置+方向'
        },
        {
            value: 'translationxy5d',
            label: '5D Translation XY',
            description: 'XY平面位置+姿态'
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
        INVALID_FILE_EXTENSION: '文件扩展名必须为 .urdf',
        FILE_TOO_LARGE: '文件大小超过 10MB 限制',
        INVALID_XML: '文件不是有效的 XML 格式',
        NETWORK_ERROR: '网络连接失败，请检查网络后重试',
        AUTH_FAILED: '认证失败，请检查 Token 权限',
        PERMISSION_DENIED: '权限不足或 API 速率限制',
        RESOURCE_NOT_FOUND: '资源未找到，请检查仓库配置',
        INVALID_PARAMETERS: '参数验证失败，请检查输入',
        WORKFLOW_TIMEOUT: '工作流执行超时（30分钟）',
        ARTIFACT_NOT_FOUND: 'Artifact 未找到，工作流可能未成功完成',
        UNKNOWN_ERROR: '发生未知错误，请查看控制台日志'
    },
    
    // Status Messages
    STATUS_MESSAGES: {
        NOT_STARTED: '未开始',
        QUEUED: '排队中',
        IN_PROGRESS: '执行中',
        COMPLETED: '已完成',
        FAILED: '失败',
        CANCELLED: '已取消'
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
