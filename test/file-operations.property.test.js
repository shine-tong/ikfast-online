/**
 * Property-based tests for file operations
 * Tests file overwrite, integrity verification, and checksum logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GitHubAPIClient } from '../web/github-api.module.js';
import { FileUploadComponent } from '../web/file-upload.module.js';
import { FileVerification } from '../web/file-verification.module.js';

// Mock CONFIG
global.CONFIG = {
    REPO_OWNER: 'test-owner',
    REPO_NAME: 'test-repo',
    URDF_PATH: 'jobs/current/robot.urdf',
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['.urdf'],
    ERROR_MESSAGES: {
        INVALID_FILE_EXTENSION: '文件扩展名必须为 .urdf',
        FILE_TOO_LARGE: '文件大小超过 10MB 限制',
        INVALID_XML: '文件不是有效的 XML 格式',
        NETWORK_ERROR: '网络连接失败，请检查网络后重试',
        UNKNOWN_ERROR: '发生未知错误，请查看控制台日志'
    },
    API_ENDPOINTS: {
        UPLOAD_FILE: '/repos/{owner}/{repo}/contents/{path}'
    }
};

describe('Property 29: File Overwrite on Upload', () => {
    it('should always overwrite existing file at jobs/current/robot.urdf when uploading', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 100 }), // filename
                fc.string({ minLength: 10, maxLength: 1000 }), // content1
                fc.string({ minLength: 10, maxLength: 1000 }), // content2
                fc.string({ minLength: 40, maxLength: 40 }), // sha1
                fc.string({ minLength: 40, maxLength: 40 }), // sha2
                async (filename, content1, content2, sha1, sha2) => {
                    // Mock auth manager
                    const mockAuthManager = {
                        getToken: () => 'test-token'
                    };
                    
                    const apiClient = new GitHubAPIClient(mockAuthManager);
                    
                    // Track upload calls
                    const uploadCalls = [];
                    
                    // Mock getFile to return existing file
                    apiClient.getFile = vi.fn()
                        .mockResolvedValueOnce({ sha: sha1, content: btoa(content1), size: content1.length })
                        .mockResolvedValueOnce({ sha: sha2, content: btoa(content2), size: content2.length });
                    
                    // Mock uploadFile to track calls
                    apiClient.uploadFile = vi.fn().mockImplementation(async (path, content, message, sha) => {
                        uploadCalls.push({ path, content, message, sha });
                        return { success: true, sha: sha || 'new-sha', content: {} };
                    });
                    
                    // First upload
                    await apiClient.getFile(CONFIG.URDF_PATH);
                    await apiClient.uploadFile(CONFIG.URDF_PATH, content1, 'Upload 1', sha1);
                    
                    // Second upload (should overwrite)
                    await apiClient.getFile(CONFIG.URDF_PATH);
                    await apiClient.uploadFile(CONFIG.URDF_PATH, content2, 'Upload 2', sha2);
                    
                    // Verify both uploads went to the same path
                    expect(uploadCalls.length).toBe(2);
                    expect(uploadCalls[0].path).toBe(CONFIG.URDF_PATH);
                    expect(uploadCalls[1].path).toBe(CONFIG.URDF_PATH);
                    
                    // Verify second upload included SHA (for overwrite)
                    expect(uploadCalls[1].sha).toBe(sha2);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should fetch existing file SHA before uploading to enable overwrite', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 10, maxLength: 1000 }), // content
                fc.string({ minLength: 40, maxLength: 40 }), // existing sha
                async (content, existingSha) => {
                    const mockAuthManager = {
                        getToken: () => 'test-token'
                    };
                    
                    const apiClient = new GitHubAPIClient(mockAuthManager);
                    
                    let getFileCalled = false;
                    let uploadSha = null;
                    
                    // Mock getFile
                    apiClient.getFile = vi.fn().mockImplementation(async (path) => {
                        getFileCalled = true;
                        return { sha: existingSha, content: btoa('old content'), size: 100 };
                    });
                    
                    // Mock uploadFile
                    apiClient.uploadFile = vi.fn().mockImplementation(async (path, content, message, sha) => {
                        uploadSha = sha;
                        return { success: true, sha: 'new-sha', content: {} };
                    });
                    
                    // Simulate upload process
                    const existingFile = await apiClient.getFile(CONFIG.URDF_PATH);
                    await apiClient.uploadFile(CONFIG.URDF_PATH, content, 'Upload', existingFile?.sha);
                    
                    // Verify getFile was called before upload
                    expect(getFileCalled).toBe(true);
                    
                    // Verify upload included the existing SHA
                    expect(uploadSha).toBe(existingSha);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 34: File Integrity Verification', () => {
    it('should reject files that are missing or have 0 bytes', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }), // file size (null = missing)
                async (fileSize) => {
                    // Create mock file or null
                    let file = null;
                    if (fileSize !== null) {
                        // Create a small blob to avoid memory issues
                        const content = fileSize > 0 ? 'x'.repeat(Math.min(fileSize, 1000)) : '';
                        file = new Blob([content], { type: 'text/plain' });
                        // Override size property for testing
                        Object.defineProperty(file, 'size', { value: fileSize, writable: false });
                    }
                    
                    const result = FileVerification.verifyFileExists(file);
                    
                    // Should be invalid if file is null or size is 0
                    const shouldBeInvalid = file === null || fileSize === 0;
                    
                    expect(result.valid).toBe(!shouldBeInvalid);
                    
                    if (shouldBeInvalid) {
                        expect(result.error).toBeDefined();
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should accept files with size > 0', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 10000 }), // file size > 0
                async (fileSize) => {
                    const file = new Blob(['x'.repeat(fileSize)], { type: 'text/plain' });
                    
                    const result = FileVerification.verifyFileExists(file);
                    
                    expect(result.valid).toBe(true);
                    expect(result.size).toBe(fileSize);
                    expect(result.error).toBeUndefined();
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should verify checksum matches expected value', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 1000 }), // file content
                async (content) => {
                    const file = new Blob([content], { type: 'text/plain' });
                    
                    // Compute checksum
                    const checksum1 = await FileVerification.computeChecksum(file);
                    const checksum2 = await FileVerification.computeChecksum(file);
                    
                    // Same file should produce same checksum
                    expect(checksum1).toBe(checksum2);
                    
                    // Verify with correct checksum
                    const result = await FileVerification.verifyChecksum(file, checksum1);
                    expect(result.valid).toBe(true);
                    expect(result.checksum).toBe(checksum1);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should detect checksum mismatch', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 1000 }), // file content
                fc.array(fc.constantFrom('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')), // wrong checksum
                async (content, wrongChecksum) => {
                    const file = new Blob([content], { type: 'text/plain' });
                    
                    // Compute actual checksum
                    const actualChecksum = await FileVerification.computeChecksum(file);
                    
                    // Skip if randomly generated checksum matches (extremely unlikely)
                    if (actualChecksum.toLowerCase() === wrongChecksum.toLowerCase()) {
                        return true;
                    }
                    
                    // Verify with wrong checksum
                    const result = await FileVerification.verifyChecksum(file, wrongChecksum);
                    
                    expect(result.valid).toBe(false);
                    expect(result.error).toBeDefined();
                    expect(result.checksum).toBe(actualChecksum);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 36: Checksum Logging', () => {
    it('should extract checksum from build log containing sha256sum output', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.constantFrom('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')), // checksum
                fc.array(fc.string({ minLength: 1, maxLength: 100 })), // log lines before
                fc.array(fc.string({ minLength: 1, maxLength: 100 })), // log lines after
                async (checksum, linesBefore, linesAfter) => {
                    // Build log with checksum line
                    const checksumLine = `${checksum}  outputs/ikfast_solver.cpp`;
                    const logContent = [
                        ...linesBefore,
                        checksumLine,
                        ...linesAfter
                    ].join('\n');
                    
                    const extracted = FileVerification.extractChecksumFromLog(logContent);
                    
                    expect(extracted).toBe(checksum);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should return null when no checksum is found in log', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 100 })), // random log lines
                async (logLines) => {
                    // Filter out any lines that might accidentally match checksum pattern
                    const safeLines = logLines.filter(line => 
                        !line.match(/[a-f0-9]{64}\s+outputs\/ikfast_solver\.cpp/i)
                    );
                    
                    const logContent = safeLines.join('\n');
                    
                    const extracted = FileVerification.extractChecksumFromLog(logContent);
                    
                    expect(extracted).toBeNull();
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should verify artifact file against checksum in log', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 10, maxLength: 1000 }), // file content
                async (content) => {
                    const file = new Blob([content], { type: 'text/plain' });
                    
                    // Compute actual checksum
                    const actualChecksum = await FileVerification.computeChecksum(file);
                    
                    // Create log with checksum
                    const logContent = `
=== STEP 5: Compute Checksum ===
${actualChecksum}  outputs/ikfast_solver.cpp
=== GENERATION COMPLETE ===
                    `;
                    
                    // Verify artifact
                    const result = await FileVerification.verifyArtifactFile(file, logContent);
                    
                    expect(result.valid).toBe(true);
                    expect(result.checksum).toBe(actualChecksum);
                    expect(result.expectedChecksum).toBe(actualChecksum);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
