// Test setup file
// Mock sessionStorage for tests
global.sessionStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock CONFIG object
global.CONFIG = {
  GITHUB_API_BASE: 'https://api.github.com',
  GITHUB_API_VERSION: '2022-11-28',
  REPO_OWNER: 'test-owner',
  REPO_NAME: 'test-repo',
  WORKFLOW_FILE: 'ikfast.yml',
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB
  ALLOWED_EXTENSIONS: ['.urdf'],
  URDF_PATH: 'jobs/current/robot.urdf',
  IK_TYPES: [
    { value: 'transform6d', label: '6D Transform (默认)', description: '完整的位置和姿态' },
    { value: 'translation3d', label: '3D Translation', description: '仅位置，无姿态约束' },
    { value: 'direction3d', label: '3D Direction', description: '方向向量' },
    { value: 'ray4d', label: '4D Ray', description: '射线（原点+方向）' },
    { value: 'lookat3d', label: '3D Look-At', description: '注视点' },
    { value: 'translationdirection5d', label: '5D Translation+Direction', description: '位置+方向' },
    { value: 'translationxy5d', label: '5D Translation XY', description: 'XY平面位置+姿态' }
  ],
  ERROR_MESSAGES: {
    INVALID_FILE_EXTENSION: '文件扩展名必须为 .urdf',
    FILE_TOO_LARGE: '文件大小超过 10MB 限制',
    INVALID_XML: '文件不是有效的 XML 格式',
    NETWORK_ERROR: '网络连接失败，请检查网络后重试',
    UNKNOWN_ERROR: '发生未知错误，请查看控制台日志'
  },
  API_ENDPOINTS: {
    UPLOAD_FILE: '/repos/{owner}/{repo}/contents/{path}',
    TRIGGER_WORKFLOW: '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
    GET_WORKFLOW_RUN: '/repos/{owner}/{repo}/actions/runs/{run_id}',
    LIST_WORKFLOW_RUNS: '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs',
    LIST_ARTIFACTS: '/repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
    DOWNLOAD_ARTIFACT: '/repos/{owner}/{repo}/actions/artifacts/{artifact_id}/zip',
    GET_WORKFLOW_LOGS: '/repos/{owner}/{repo}/actions/runs/{run_id}/logs',
    VALIDATE_TOKEN: '/user'
  }
};

// Clear sessionStorage before each test
beforeEach(() => {
  sessionStorage.clear();
});
