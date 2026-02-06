/**
 * Property-based tests for LogViewerComponent
 * Tests Property 21, 22, 23: Log Content Preservation, STEP Highlighting, Log Incremental Append
 * Validates: Requirements 6.2, 6.3, 6.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
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

describe('LogViewerComponent - Property Tests', () => {
    let mockGitHubAPI;
    let component;
    
    beforeEach(() => {
        // Mock GitHub API client
        mockGitHubAPI = {
            getWorkflowLogs: vi.fn(),
            listArtifacts: vi.fn(),
            downloadArtifact: vi.fn()
        };
        
        component = new LogViewerComponent(mockGitHubAPI);
    });
    
    /**
     * Property 23: Log Incremental Append
     * For any new log content retrieved during polling, the system should 
     * append it to the existing log display without clearing previous content
     */
    describe('Property 23: Log Incremental Append', () => {
        it('should append log chunks without clearing previous content', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string(), { minLength: 1, maxLength: 20 }),
                    (logChunks) => {
                        // Reset component for each test
                        component.reset();
                        
                        let accumulated = '';
                        
                        // Append each chunk
                        for (const chunk of logChunks) {
                            component.appendLog(chunk);
                            accumulated += chunk;
                        }
                        
                        // Verify accumulated content matches
                        const content = component.getContent();
                        return content === accumulated;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should preserve order of appended log chunks', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
                    (logChunks) => {
                        // Reset component
                        component.reset();
                        
                        // Append chunks
                        for (const chunk of logChunks) {
                            component.appendLog(chunk);
                        }
                        
                        // Verify order is preserved
                        const content = component.getContent();
                        const expected = logChunks.join('');
                        
                        return content === expected;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should handle empty chunks without affecting existing content', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.oneof(fc.string(), fc.constant('')), { minLength: 1, maxLength: 10 }),
                    (logChunks) => {
                        // Reset component
                        component.reset();
                        
                        // Append chunks
                        for (const chunk of logChunks) {
                            component.appendLog(chunk);
                        }
                        
                        // Verify content matches non-empty chunks
                        const content = component.getContent();
                        const expected = logChunks.join('');
                        
                        return content === expected;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should maintain content length after multiple appends', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 20 }),
                    (logChunks) => {
                        // Reset component
                        component.reset();
                        
                        let expectedLength = 0;
                        
                        // Append chunks and track length
                        for (const chunk of logChunks) {
                            component.appendLog(chunk);
                            expectedLength += chunk.length;
                        }
                        
                        // Verify total length
                        const content = component.getContent();
                        return content.length === expectedLength;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
    
    /**
     * Property 21: Log Content Preservation
     * For any log content containing ANSI escape codes, the system should 
     * either preserve them or convert them to HTML formatting for display
     */
    describe('Property 21: Log Content Preservation', () => {
        it('should preserve or convert ANSI codes without losing content', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 200 }),
                    (logContent) => {
                        // Reset component
                        component.reset();
                        
                        // Append log with potential ANSI codes
                        component.appendLog(logContent);
                        
                        // Get processed content
                        const content = component.getContent();
                        
                        // Content should be preserved (same or processed)
                        return content === logContent;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should handle ANSI escape sequences', () => {
            const ansiCodes = [
                '\x1b[31mRed text\x1b[0m',
                '\x1b[32mGreen text\x1b[0m',
                '\x1b[1mBold text\x1b[0m',
                '\x1b[31mRed text\x1b[0m',
                'Normal text \x1b[33mYellow\x1b[0m more text'
            ];
            
            for (const ansiText of ansiCodes) {
                component.reset();
                component.appendLog(ansiText);
                
                const content = component.getContent();
                
                // Content should be stored (ANSI codes may be removed in processing)
                expect(content).toBe(ansiText);
            }
        });
        
        it('should preserve line breaks and whitespace', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
                    (lines) => {
                        // Reset component
                        component.reset();
                        
                        const logContent = lines.join('\n');
                        component.appendLog(logContent);
                        
                        const content = component.getContent();
                        
                        // Line breaks should be preserved
                        return content === logContent;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
    
    /**
     * Property 22: Log Step Highlighting
     * For any log content containing STEP markers (e.g., "=== STEP 1: ==="), 
     * the system should apply visual highlighting to make steps clearly identifiable
     */
    describe('Property 22: Log Step Highlighting', () => {
        it('should identify STEP markers in various formats', () => {
            const stepMarkers = [
                '=== STEP 1: URDF to Collada ===',
                '=== STEP 2: Generate IKFast ===',
                'STEP 1: Starting process',
                'Step 1: Initialize',
                '=== STEP 10: Final step ===',
                '===STEP 5:No spaces==='
            ];
            
            for (const marker of stepMarkers) {
                const isStep = component.isStepMarker(marker);
                expect(isStep).toBe(true);
            }
        });
        
        it('should not identify non-STEP lines as STEP markers', () => {
            fc.assert(
                fc.property(
                    fc.string().filter(s => !s.match(/===\s*STEP\s+\d+:/i) && !s.match(/^STEP\s+\d+:/i)),
                    (line) => {
                        const isStep = component.isStepMarker(line);
                        return !isStep;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should process STEP markers with highlighting', () => {
            component.reset();
            
            const logWithSteps = `
Starting process
=== STEP 1: URDF to Collada ===
Processing file...
=== STEP 2: Generate IKFast ===
Generating solver...
Complete
            `.trim();
            
            component.appendLog(logWithSteps);
            
            // Process the content
            const processed = component.processLogContent(logWithSteps);
            
            // Should contain log-step class for STEP markers
            expect(processed).toContain('log-step');
        });
        
        it('should identify all STEP patterns', () => {
            const patterns = [
                { text: '=== STEP 1: Test ===', expected: true },
                { text: 'STEP 1: Test', expected: true },
                { text: 'Step 1: Test', expected: true },
                { text: '=== STEP 99: Test ===', expected: true },
                { text: 'Not a step', expected: false },
                { text: 'STEP: Missing number', expected: false },
                { text: 'Step without colon', expected: false }
            ];
            
            for (const pattern of patterns) {
                const result = component.isStepMarker(pattern.text);
                expect(result).toBe(pattern.expected);
            }
        });
    });
    
    /**
     * Additional property: Error line identification
     */
    describe('Error Line Identification', () => {
        it('should identify error lines correctly', () => {
            const errorLines = [
                'Error: File not found',
                'FAILED: Build failed',
                'Exception: Invalid input',
                'Traceback (most recent call last):',
                '[ERROR] Something went wrong',
                '[FAIL] Test failed'
            ];
            
            for (const line of errorLines) {
                const isError = component.isErrorLine(line);
                expect(isError).toBe(true);
            }
        });
        
        it('should not identify normal lines as errors', () => {
            fc.assert(
                fc.property(
                    fc.string().filter(s => 
                        !s.match(/error:/i) && 
                        !s.match(/failed:/i) && 
                        !s.match(/exception:/i) &&
                        !s.match(/traceback/i) &&
                        !s.match(/\[ERROR\]/i) &&
                        !s.match(/\[FAIL\]/i)
                    ),
                    (line) => {
                        const isError = component.isErrorLine(line);
                        return !isError;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

// Tag: Feature: ikfast-online-generator, Property 21: Log content preservation
// Tag: Feature: ikfast-online-generator, Property 22: Log step highlighting
// Tag: Feature: ikfast-online-generator, Property 23: Log incremental append
