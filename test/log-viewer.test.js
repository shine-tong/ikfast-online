/**
 * Unit tests for LogViewerComponent
 * Tests log appending, ANSI code handling, auto-scrolling, error styling
 * Validates: Requirements 6.2, 6.3, 6.4, 9.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogViewerComponent } from '../web/log-viewer.module.js';

// Mock document for testing
global.document = {
    createElement: (tag) => {
        const element = {
            tagName: tag,
            _textContent: '',
            get textContent() {
                return this._textContent;
            },
            set textContent(value) {
                this._textContent = value;
                // Simulate innerHTML escaping
                this.innerHTML = value
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            },
            innerHTML: '',
            style: {},
            addEventListener: vi.fn(),
            scrollTop: 0,
            scrollHeight: 100
        };
        return element;
    }
};

describe('LogViewerComponent - Unit Tests', () => {
    let mockGitHubAPI;
    let component;
    let mockElements;
    
    beforeEach(() => {
        // Mock GitHub API client
        mockGitHubAPI = {
            getWorkflowLogs: vi.fn(),
            listArtifacts: vi.fn(),
            downloadArtifact: vi.fn()
        };
        
        component = new LogViewerComponent(mockGitHubAPI);
        
        // Mock DOM elements
        mockElements = {
            logViewer: {
                innerHTML: '',
                style: {},
                scrollTop: 0,
                scrollHeight: 100
            },
            autoScrollToggle: {
                checked: true,
                addEventListener: vi.fn()
            }
        };
    });
    
    describe('Initialization', () => {
        it('should initialize with empty log content', () => {
            expect(component.getContent()).toBe('');
        });
        
        it('should initialize with auto-scroll enabled', () => {
            expect(component.getAutoScroll()).toBe(true);
        });
        
        it('should initialize UI elements correctly', () => {
            component.initializeUI(mockElements);
            
            expect(component.elements).toBe(mockElements);
            expect(mockElements.logViewer.style.fontFamily).toBe('monospace');
            expect(mockElements.logViewer.style.whiteSpace).toBe('pre-wrap');
            expect(mockElements.logViewer.style.overflowY).toBe('auto');
        });
        
        it('should set up auto-scroll toggle listener', () => {
            component.initializeUI(mockElements);
            
            expect(mockElements.autoScrollToggle.addEventListener).toHaveBeenCalledWith(
                'change',
                expect.any(Function)
            );
        });
    });
    
    describe('Log Appending (Requirement 6.4)', () => {
        it('should append log content without clearing', () => {
            component.appendLog('First line\n');
            expect(component.getContent()).toBe('First line\n');
            
            component.appendLog('Second line\n');
            expect(component.getContent()).toBe('First line\nSecond line\n');
            
            component.appendLog('Third line\n');
            expect(component.getContent()).toBe('First line\nSecond line\nThird line\n');
        });
        
        it('should handle empty content gracefully', () => {
            component.appendLog('');
            expect(component.getContent()).toBe('');
            
            component.appendLog('Content');
            component.appendLog('');
            expect(component.getContent()).toBe('Content');
        });
        
        it('should handle null or undefined content', () => {
            component.appendLog(null);
            expect(component.getContent()).toBe('');
            
            component.appendLog(undefined);
            expect(component.getContent()).toBe('');
        });
        
        it('should preserve multiple appends in order', () => {
            const chunks = ['Line 1\n', 'Line 2\n', 'Line 3\n'];
            
            chunks.forEach(chunk => component.appendLog(chunk));
            
            expect(component.getContent()).toBe(chunks.join(''));
        });
    });
    
    describe('ANSI Code Handling (Requirement 6.2)', () => {
        it('should remove ANSI escape codes', () => {
            const textWithAnsi = '\x1b[31mRed text\x1b[0m';
            const processed = component.handleAnsiCodes(textWithAnsi);
            
            expect(processed).toBe('Red text');
        });
        
        it('should handle multiple ANSI codes in one line', () => {
            const textWithAnsi = '\x1b[31mRed\x1b[0m and \x1b[32mGreen\x1b[0m';
            const processed = component.handleAnsiCodes(textWithAnsi);
            
            expect(processed).toBe('Red and Green');
        });
        
        it('should handle text without ANSI codes', () => {
            const plainText = 'Plain text without codes';
            const processed = component.handleAnsiCodes(plainText);
            
            expect(processed).toBe(plainText);
        });
        
        it('should preserve content after removing ANSI codes', () => {
            component.appendLog('\x1b[31mError message\x1b[0m');
            
            const content = component.getContent();
            expect(content).toContain('Error message');
        });
    });
    
    describe('STEP Highlighting (Requirement 6.3)', () => {
        it('should identify STEP markers with === format', () => {
            expect(component.isStepMarker('=== STEP 1: URDF to Collada ===')).toBe(true);
            expect(component.isStepMarker('=== STEP 2: Generate IKFast ===')).toBe(true);
            expect(component.isStepMarker('===STEP 3:No spaces===')).toBe(true);
        });
        
        it('should identify STEP markers without === format', () => {
            expect(component.isStepMarker('STEP 1: Starting')).toBe(true);
            expect(component.isStepMarker('Step 1: Initialize')).toBe(true);
        });
        
        it('should not identify non-STEP lines', () => {
            expect(component.isStepMarker('Normal log line')).toBe(false);
            expect(component.isStepMarker('STEP: Missing number')).toBe(false);
            expect(component.isStepMarker('Step without number')).toBe(false);
        });
        
        it('should apply log-step class to STEP markers', () => {
            const logContent = '=== STEP 1: Test ===\nNormal line';
            const processed = component.processLogContent(logContent);
            
            expect(processed).toContain('log-step');
            expect(processed).toContain('STEP 1');
        });
    });
    
    describe('Error Styling (Requirement 9.5)', () => {
        it('should identify error lines', () => {
            expect(component.isErrorLine('Error: Something went wrong')).toBe(true);
            expect(component.isErrorLine('FAILED: Build failed')).toBe(true);
            expect(component.isErrorLine('Exception: Invalid input')).toBe(true);
            expect(component.isErrorLine('[ERROR] Error message')).toBe(true);
        });
        
        it('should not identify normal lines as errors', () => {
            expect(component.isErrorLine('Normal log line')).toBe(false);
            expect(component.isErrorLine('Success: Operation completed')).toBe(false);
            expect(component.isErrorLine('Info: Processing...')).toBe(false);
        });
        
        it('should apply log-error class to error lines', () => {
            const logContent = 'Normal line\nError: Something failed\nAnother line';
            const processed = component.processLogContent(logContent);
            
            expect(processed).toContain('log-error');
            expect(processed).toContain('Error: Something failed');
        });
        
        it('should differentiate error styling from normal output', () => {
            const logContent = 'Normal line\nError: Failed\nNormal line';
            const processed = component.processLogContent(logContent);
            
            // Error line should have log-error class
            const lines = processed.split('\n');
            expect(lines[1]).toContain('log-error');
            
            // Normal lines should not have log-error class
            expect(lines[0]).not.toContain('log-error');
            expect(lines[2]).not.toContain('log-error');
        });
    });
    
    describe('Auto-scrolling', () => {
        it('should scroll to bottom when auto-scroll is enabled', () => {
            component.initializeUI(mockElements);
            component.setAutoScroll(true);
            
            component.appendLog('New log content');
            
            // scrollToBottom should set scrollTop to scrollHeight
            component.scrollToBottom();
            expect(mockElements.logViewer.scrollTop).toBe(mockElements.logViewer.scrollHeight);
        });
        
        it('should not scroll when auto-scroll is disabled', () => {
            component.initializeUI(mockElements);
            component.setAutoScroll(false);
            
            mockElements.logViewer.scrollTop = 50;
            component.appendLog('New log content');
            
            // scrollTop should remain unchanged
            expect(mockElements.logViewer.scrollTop).toBe(50);
        });
        
        it('should toggle auto-scroll state', () => {
            expect(component.getAutoScroll()).toBe(true);
            
            component.setAutoScroll(false);
            expect(component.getAutoScroll()).toBe(false);
            
            component.setAutoScroll(true);
            expect(component.getAutoScroll()).toBe(true);
        });
        
        it('should update toggle checkbox when setting auto-scroll', () => {
            component.initializeUI(mockElements);
            
            component.setAutoScroll(false);
            expect(mockElements.autoScrollToggle.checked).toBe(false);
            
            component.setAutoScroll(true);
            expect(mockElements.autoScrollToggle.checked).toBe(true);
        });
    });
    
    describe('Log Fetching', () => {
        it('should fetch logs from workflow run', async () => {
            const mockLogs = 'Log line 1\nLog line 2\n';
            mockGitHubAPI.getWorkflowLogs.mockResolvedValue(mockLogs);
            
            const logs = await component.fetchLogs(12345);
            
            expect(logs).toBe(mockLogs);
            expect(mockGitHubAPI.getWorkflowLogs).toHaveBeenCalledWith(12345);
        });
        
        it('should fallback to artifact if workflow logs not available', async () => {
            mockGitHubAPI.getWorkflowLogs.mockRejectedValue(new Error('Not available'));
            mockGitHubAPI.listArtifacts.mockResolvedValue([
                { id: 1, name: 'ikfast-result' }
            ]);
            mockGitHubAPI.downloadArtifact.mockResolvedValue('Artifact log content');
            
            const logs = await component.fetchLogs(12345);
            
            expect(logs).toBe('Artifact log content');
            expect(mockGitHubAPI.listArtifacts).toHaveBeenCalledWith(12345);
            expect(mockGitHubAPI.downloadArtifact).toHaveBeenCalledWith(1);
        });
        
        it('should throw error if no logs available', async () => {
            mockGitHubAPI.getWorkflowLogs.mockRejectedValue(new Error('Not available'));
            mockGitHubAPI.listArtifacts.mockResolvedValue([]);
            
            await expect(component.fetchLogs(12345)).rejects.toThrow('No logs available');
        });
    });
    
    describe('Content Processing', () => {
        it('should escape HTML special characters', () => {
            const htmlContent = '<script>alert("xss")</script>';
            const escaped = component.escapeHtml(htmlContent);
            
            expect(escaped).not.toContain('<script>');
            expect(escaped).toContain('&lt;script&gt;');
        });
        
        it('should process multi-line content correctly', () => {
            const multiLine = 'Line 1\nLine 2\nLine 3';
            const processed = component.processLogContent(multiLine);
            
            expect(processed).toContain('Line 1');
            expect(processed).toContain('Line 2');
            expect(processed).toContain('Line 3');
        });
        
        it('should handle empty content', () => {
            const processed = component.processLogContent('');
            expect(processed).toBe('');
        });
        
        it('should handle null content', () => {
            const processed = component.processLogContent(null);
            expect(processed).toBe('');
        });
    });
    
    describe('Clear and Reset', () => {
        it('should clear log content', () => {
            component.appendLog('Some content');
            expect(component.getContent()).toBe('Some content');
            
            component.clearLog();
            expect(component.getContent()).toBe('');
        });
        
        it('should reset component state', () => {
            component.appendLog('Some content');
            component.runId = 12345;
            
            component.reset();
            
            expect(component.getContent()).toBe('');
            expect(component.runId).toBeNull();
        });
    });
    
    describe('Display Update', () => {
        it('should update display when appending logs', () => {
            component.initializeUI(mockElements);
            
            component.appendLog('Test log content');
            
            expect(mockElements.logViewer.innerHTML).toContain('Test log content');
        });
        
        it('should not update display if elements not initialized', () => {
            // Don't initialize UI
            component.appendLog('Test content');
            
            // Should not throw error
            expect(component.getContent()).toBe('Test content');
        });
    });
});
