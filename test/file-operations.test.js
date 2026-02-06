/**
 * Unit tests for file operations
 * Tests file overwrite, file verification, and quota warning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubAPIClient } from '../web/github-api.module.js';
import { FileUploadComponent } from '../web/file-upload.module.js';
import { FileVerification } from '../web/file-verification.module.js';
import { QuotaWarningComponent } from '../web/quota-warning.module.js';

// Mock CONFIG
global.CONFIG = {
    REPO_OWNER: 'test-owner',
    REPO_NAME: 'test-repo',
    URDF_PATH: 'jobs/current/robot.urdf',
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['.urdf'],
    QUOTA_WARNING_THRESHOLD: 0.8,
    ERROR_MESSAGES: {
        INVALID_FILE_EXTENSION: '文件扩展名必须为 .urdf',
        FILE_TOO_LARGE: '文件大小超过 10MB 限制',
        INVALID_XML: '文件不是有效的 XML 格式',
        NETWORK_ERROR: '网络连接失败，请检查网络后重试',
        UNKNOWN_ERROR: '发生未知错误，请查看控制台日志'
    },
    API_ENDPOINTS: {
        UPLOAD_FILE: '/repos/{owner}/{repo}/contents/{path}',
        GET_BILLING_ACTIONS: '/repos/{owner}/{repo}/actions/billing/usage'
    }
};

describe('File Overwrite Tests', () => {
    let mockAuthManager;
    let apiClient;
    
    beforeEach(() => {
        mockAuthManager = {
            getToken: () => 'test-token'
        };
        apiClient = new GitHubAPIClient(mockAuthManager);
    });
    
    it('should fetch existing file SHA before uploading', async () => {
        const existingSha = 'abc123def456';
        const newContent = 'new file content';
        
        // Mock getFile to return existing file
        apiClient.getFile = vi.fn().mockResolvedValue({
            sha: existingSha,
            content: btoa('old content'),
            size: 100
        });
        
        // Mock uploadFile
        apiClient.uploadFile = vi.fn().mockResolvedValue({
            success: true,
            sha: 'new-sha',
            content: {}
        });
        
        // Simulate upload process
        const existingFile = await apiClient.getFile(CONFIG.URDF_PATH);
        await apiClient.uploadFile(CONFIG.URDF_PATH, newContent, 'Upload', existingFile.sha);
        
        // Verify getFile was called
        expect(apiClient.getFile).toHaveBeenCalledWith(CONFIG.URDF_PATH);
        
        // Verify uploadFile was called with existing SHA
        expect(apiClient.uploadFile).toHaveBeenCalledWith(
            CONFIG.URDF_PATH,
            newContent,
            'Upload',
            existingSha
        );
    });
    
    it('should handle case when file does not exist (first upload)', async () => {
        const newContent = 'new file content';
        
        // Mock getFile to return null (file doesn't exist)
        apiClient.getFile = vi.fn().mockResolvedValue(null);
        
        // Mock uploadFile
        apiClient.uploadFile = vi.fn().mockResolvedValue({
            success: true,
            sha: 'new-sha',
            content: {}
        });
        
        // Simulate upload process
        const existingFile = await apiClient.getFile(CONFIG.URDF_PATH);
        await apiClient.uploadFile(CONFIG.URDF_PATH, newContent, 'Upload', existingFile?.sha);
        
        // Verify uploadFile was called without SHA (undefined when file is null)
        expect(apiClient.uploadFile).toHaveBeenCalledWith(
            CONFIG.URDF_PATH,
            newContent,
            'Upload',
            undefined
        );
    });
    
    it('should always upload to the same path (jobs/current/robot.urdf)', async () => {
        const uploadCalls = [];
        
        apiClient.getFile = vi.fn().mockResolvedValue({ sha: 'sha1', content: '', size: 0 });
        apiClient.uploadFile = vi.fn().mockImplementation(async (path, content, message, sha) => {
            uploadCalls.push({ path, content, message, sha });
            return { success: true, sha: 'new-sha', content: {} };
        });
        
        // Multiple uploads
        await apiClient.getFile(CONFIG.URDF_PATH);
        await apiClient.uploadFile(CONFIG.URDF_PATH, 'content1', 'Upload 1', 'sha1');
        
        await apiClient.getFile(CONFIG.URDF_PATH);
        await apiClient.uploadFile(CONFIG.URDF_PATH, 'content2', 'Upload 2', 'sha2');
        
        // Verify all uploads went to the same path
        expect(uploadCalls.length).toBe(2);
        expect(uploadCalls[0].path).toBe(CONFIG.URDF_PATH);
        expect(uploadCalls[1].path).toBe(CONFIG.URDF_PATH);
    });
});

describe('File Verification Tests', () => {
    it('should reject missing files', () => {
        const result = FileVerification.verifyFileExists(null);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('File is missing');
        expect(result.size).toBe(0);
    });
    
    it('should reject empty files (0 bytes)', () => {
        const emptyFile = new Blob([], { type: 'text/plain' });
        
        const result = FileVerification.verifyFileExists(emptyFile);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('File is empty (0 bytes)');
        expect(result.size).toBe(0);
    });
    
    it('should accept files with size > 0', () => {
        const file = new Blob(['content'], { type: 'text/plain' });
        
        const result = FileVerification.verifyFileExists(file);
        
        expect(result.valid).toBe(true);
        expect(result.size).toBe(7); // 'content' is 7 bytes
        expect(result.error).toBeUndefined();
    });
    
    it('should compute SHA-256 checksum', async () => {
        const content = 'test content';
        const file = new Blob([content], { type: 'text/plain' });
        
        const checksum = await FileVerification.computeChecksum(file);
        
        expect(checksum).toBeDefined();
        expect(checksum.length).toBe(64); // SHA-256 is 64 hex characters
        expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should produce consistent checksums for same content', async () => {
        const content = 'test content';
        const file1 = new Blob([content], { type: 'text/plain' });
        const file2 = new Blob([content], { type: 'text/plain' });
        
        const checksum1 = await FileVerification.computeChecksum(file1);
        const checksum2 = await FileVerification.computeChecksum(file2);
        
        expect(checksum1).toBe(checksum2);
    });
    
    it('should verify matching checksums', async () => {
        const content = 'test content';
        const file = new Blob([content], { type: 'text/plain' });
        
        const expectedChecksum = await FileVerification.computeChecksum(file);
        const result = await FileVerification.verifyChecksum(file, expectedChecksum);
        
        expect(result.valid).toBe(true);
        expect(result.checksum).toBe(expectedChecksum);
        expect(result.error).toBeUndefined();
    });
    
    it('should detect mismatched checksums', async () => {
        const content = 'test content';
        const file = new Blob([content], { type: 'text/plain' });
        const wrongChecksum = '0000000000000000000000000000000000000000000000000000000000000000';
        
        const result = await FileVerification.verifyChecksum(file, wrongChecksum);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Checksum mismatch - file may be corrupted');
        expect(result.checksum).not.toBe(wrongChecksum);
    });
    
    it('should extract checksum from build log', () => {
        const checksum = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
        const logContent = `
=== STEP 4: Verify Output ===
ls -lh outputs/ikfast_solver.cpp
wc -l outputs/ikfast_solver.cpp
=== STEP 5: Compute Checksum ===
${checksum}  outputs/ikfast_solver.cpp
=== GENERATION COMPLETE ===
        `;
        
        const extracted = FileVerification.extractChecksumFromLog(logContent);
        
        expect(extracted).toBe(checksum);
    });
    
    it('should return null when no checksum in log', () => {
        const logContent = `
=== STEP 1: URDF to Collada ===
=== STEP 2: Verify Collada File ===
=== GENERATION COMPLETE ===
        `;
        
        const extracted = FileVerification.extractChecksumFromLog(logContent);
        
        expect(extracted).toBeNull();
    });
    
    it('should format file sizes correctly', () => {
        expect(FileVerification.formatFileSize(0)).toBe('0 Bytes');
        expect(FileVerification.formatFileSize(500)).toBe('500 Bytes');
        expect(FileVerification.formatFileSize(1024)).toBe('1 KB');
        expect(FileVerification.formatFileSize(1536)).toBe('1.5 KB');
        expect(FileVerification.formatFileSize(1048576)).toBe('1 MB');
        expect(FileVerification.formatFileSize(1073741824)).toBe('1 GB');
    });
});

describe('Quota Warning Tests', () => {
    let mockAuthManager;
    let apiClient;
    let quotaWarning;
    
    beforeEach(() => {
        mockAuthManager = {
            getToken: () => 'test-token'
        };
        apiClient = new GitHubAPIClient(mockAuthManager);
        quotaWarning = new QuotaWarningComponent(apiClient);
        
        // Clear session storage
        sessionStorage.clear();
    });
    
    it('should display warning when quota exceeds threshold', async () => {
        // Mock billing API to return high usage
        apiClient.getActionsBillingUsage = vi.fn().mockResolvedValue({
            totalMinutesUsed: 1800,
            includedMinutes: 2000,
            percentUsed: 0.9,
            totalPaidMinutesUsed: 0
        });
        
        apiClient.checkQuotaWarning = vi.fn().mockResolvedValue({
            shouldWarn: true,
            percentUsed: 0.9,
            totalMinutesUsed: 1800,
            includedMinutes: 2000,
            message: '警告: GitHub Actions 配额已使用 90% (1800/2000 分钟)'
        });
        
        const mockElements = {
            warningContainer: { style: { display: 'none' }, className: '' },
            warningMessage: { textContent: '' },
            warningDetails: { textContent: '' }
        };
        
        quotaWarning.initializeUI(mockElements);
        
        const displayed = await quotaWarning.checkAndDisplayWarning();
        
        expect(displayed).toBe(true);
        expect(mockElements.warningContainer.style.display).toBe('block');
        expect(mockElements.warningMessage.textContent).toContain('90%');
    });
    
    it('should not display warning when quota is below threshold', async () => {
        // Mock billing API to return low usage
        apiClient.checkQuotaWarning = vi.fn().mockResolvedValue({
            shouldWarn: false,
            percentUsed: 0.5,
            totalMinutesUsed: 1000,
            includedMinutes: 2000,
            message: ''
        });
        
        const mockElements = {
            warningContainer: { style: { display: 'block' }, className: '' },
            warningMessage: { textContent: '' }
        };
        
        quotaWarning.initializeUI(mockElements);
        
        const displayed = await quotaWarning.checkAndDisplayWarning();
        
        expect(displayed).toBe(false);
        expect(mockElements.warningContainer.style.display).toBe('none');
    });
    
    it('should handle case when billing info is not accessible', async () => {
        // Mock billing API to return null (no permission)
        apiClient.checkQuotaWarning = vi.fn().mockResolvedValue(null);
        
        const displayed = await quotaWarning.checkAndDisplayWarning();
        
        expect(displayed).toBe(false);
    });
    
    it('should allow dismissing warning', () => {
        const mockElements = {
            warningContainer: { style: { display: 'block' } },
            dismissButton: { addEventListener: vi.fn() }
        };
        
        quotaWarning.initializeUI(mockElements);
        quotaWarning.dismissWarning();
        
        expect(mockElements.warningContainer.style.display).toBe('none');
        expect(sessionStorage.getItem('quotaWarningDismissed')).toBe('true');
    });
    
    it('should remember dismissal in session', () => {
        quotaWarning.dismissWarning();
        
        expect(quotaWarning.wasWarningDismissed()).toBe(true);
    });
    
    it('should not show warning again after dismissal', async () => {
        apiClient.checkQuotaWarning = vi.fn().mockResolvedValue({
            shouldWarn: true,
            percentUsed: 0.9,
            message: 'Warning'
        });
        
        // Dismiss warning
        quotaWarning.dismissWarning();
        
        // Try to start periodic check
        quotaWarning.startPeriodicCheck(1000);
        
        // Should not have started interval
        expect(quotaWarning.checkInterval).toBeNull();
    });
});
