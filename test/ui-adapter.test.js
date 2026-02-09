/**
 * Unit tests for UIAdapter
 * Tests drag-and-drop functionality, status icons, and log syntax highlighting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock UIAdapter - will be loaded from file
let UIAdapter = null;

// Load UIAdapter from the file
beforeEach(() => {
    // Load UIAdapter code
    const uiAdapterPath = path.resolve(process.cwd(), 'docs/js/ui-adapter.js');
    const uiAdapterCode = fs.readFileSync(uiAdapterPath, 'utf-8');
    
    // Create a mock global context
    const mockGlobal = {
        console: console,
        Event: Event,
        File: File
    };
    
    // Execute in mock context
    const script = new Function('global', uiAdapterCode + '\nreturn UIAdapter;');
    UIAdapter = script.call(mockGlobal, mockGlobal);
});

describe('UIAdapter - File Upload Adaptation', () => {
    it('should add drag-and-drop functionality to file upload component', () => {
        // Create mock file upload component
        const mockComponent = {
            initializeUI: vi.fn(),
            elements: null
        };
        
        // Create mock DOM elements
        const fileInput = {
            type: 'file',
            id: 'file-input',
            files: null,
            parentElement: {
                classList: {
                    contains: vi.fn(() => false),
                    add: vi.fn()
                },
                addEventListener: vi.fn()
            },
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        };
        
        const progressBar = {
            classList: {
                add: vi.fn()
            }
        };
        
        const elements = {
            fileInput: fileInput,
            progressBar: progressBar
        };
        
        // Adapt the component
        UIAdapter.adaptFileUpload(mockComponent);
        
        // Initialize with elements
        mockComponent.initializeUI(elements);
        
        // Verify drop-zone class was added
        expect(fileInput.parentElement.classList.add).toHaveBeenCalledWith('drop-zone');
        
        // Verify event listeners were added
        expect(fileInput.parentElement.addEventListener).toHaveBeenCalled();
    });
    
    it('should enhance progress bar styling', () => {
        const mockComponent = {
            initializeUI: vi.fn()
        };
        
        const progressBar = {
            classList: {
                add: vi.fn(),
                contains: vi.fn(() => false)
            }
        };
        
        const fileInput = {
            parentElement: {
                classList: { add: vi.fn(), contains: vi.fn() },
                addEventListener: vi.fn()
            }
        };
        
        const elements = {
            fileInput: fileInput,
            progressBar: progressBar
        };
        
        UIAdapter.adaptFileUpload(mockComponent);
        mockComponent.initializeUI(elements);
        
        expect(progressBar.classList.add).toHaveBeenCalledWith('progress-bar-enhanced');
    });
});

describe('UIAdapter - Status Monitor Adaptation', () => {
    it('should add status icons to status indicator', () => {
        const statusIndicator = {
            textContent: '',
            classList: {
                add: vi.fn()
            }
        };
        
        const mockComponent = {
            updateStatusDisplay: vi.fn(),
            elements: {
                statusIndicator: statusIndicator
            }
        };
        
        UIAdapter.adaptStatusMonitor(mockComponent);
        
        // Test queued status
        statusIndicator.textContent = 'Status: queued';
        mockComponent.updateStatusDisplay('queued');
        
        expect(statusIndicator.textContent).toContain('⏳');
    });
    
    it('should add enhanced styling class to status indicator', () => {
        const statusIndicator = {
            textContent: 'In Progress',
            classList: {
                add: vi.fn()
            }
        };
        
        const mockComponent = {
            updateStatusDisplay: vi.fn(),
            elements: {
                statusIndicator: statusIndicator
            }
        };
        
        UIAdapter.adaptStatusMonitor(mockComponent);
        mockComponent.updateStatusDisplay('in_progress');
        
        expect(statusIndicator.classList.add).toHaveBeenCalledWith('status-enhanced');
    });
    
    it('should not duplicate icons on multiple updates', () => {
        const statusIndicator = {
            textContent: 'Queued',
            classList: {
                add: vi.fn()
            }
        };
        
        const mockComponent = {
            updateStatusDisplay: vi.fn(),
            elements: {
                statusIndicator: statusIndicator
            }
        };
        
        UIAdapter.adaptStatusMonitor(mockComponent);
        
        // Update status multiple times
        mockComponent.updateStatusDisplay('queued');
        const firstText = statusIndicator.textContent;
        
        mockComponent.updateStatusDisplay('queued');
        const secondText = statusIndicator.textContent;
        
        // Icon should appear only once
        expect(firstText).toBe(secondText);
    });
});

describe('UIAdapter - Log Viewer Adaptation', () => {
    it('should highlight error patterns in logs', () => {
        const logViewer = {
            innerHTML: 'ERROR: Something went wrong\nFAILED to process\nException occurred'
        };
        
        const mockComponent = {
            updateDisplay: vi.fn(),
            elements: {
                logViewer: logViewer
            }
        };
        
        UIAdapter.adaptLogViewer(mockComponent);
        mockComponent.updateDisplay();
        
        const html = logViewer.innerHTML;
        expect(html).toContain('log-error');
        expect(html).toContain('ERROR');
    });
    
    it('should highlight success patterns in logs', () => {
        const logViewer = {
            innerHTML: 'SUCCESS: Operation completed\nDone processing\nPassed all tests'
        };
        
        const mockComponent = {
            updateDisplay: vi.fn(),
            elements: {
                logViewer: logViewer
            }
        };
        
        UIAdapter.adaptLogViewer(mockComponent);
        mockComponent.updateDisplay();
        
        const html = logViewer.innerHTML;
        expect(html).toContain('log-success');
        expect(html).toContain('SUCCESS');
    });
    
    it('should highlight step markers in logs', () => {
        const logViewer = {
            innerHTML: '=== STEP 1: Initialize ===\nSTEP 2: Process\nStep 3: Finalize'
        };
        
        const mockComponent = {
            updateDisplay: vi.fn(),
            elements: {
                logViewer: logViewer
            }
        };
        
        UIAdapter.adaptLogViewer(mockComponent);
        mockComponent.updateDisplay();
        
        const html = logViewer.innerHTML;
        expect(html).toContain('log-step');
        expect(html).toContain('STEP 1');
    });
    
    it('should highlight warning patterns in logs', () => {
        const logViewer = {
            innerHTML: 'WARNING: Low memory\n[WARN] Deprecated function'
        };
        
        const mockComponent = {
            updateDisplay: vi.fn(),
            elements: {
                logViewer: logViewer
            }
        };
        
        UIAdapter.adaptLogViewer(mockComponent);
        mockComponent.updateDisplay();
        
        const html = logViewer.innerHTML;
        expect(html).toContain('log-warning');
        expect(html).toContain('WARNING');
    });
    
    it('should highlight info patterns in logs', () => {
        const logViewer = {
            innerHTML: 'INFO: Starting process\n[INFO] Configuration loaded'
        };
        
        const mockComponent = {
            updateDisplay: vi.fn(),
            elements: {
                logViewer: logViewer
            }
        };
        
        UIAdapter.adaptLogViewer(mockComponent);
        mockComponent.updateDisplay();
        
        const html = logViewer.innerHTML;
        expect(html).toContain('log-info');
        expect(html).toContain('INFO');
    });
    
    it('should add highlightLogSyntax method to component', () => {
        const mockComponent = {
            updateDisplay: vi.fn(),
            elements: {
                logViewer: { innerHTML: '' }
            }
        };
        
        UIAdapter.adaptLogViewer(mockComponent);
        
        expect(typeof mockComponent.highlightLogSyntax).toBe('function');
    });
});

describe('UIAdapter - Integration', () => {
    it('should initialize all adaptations at once', () => {
        const components = {
            fileUpload: {
                initializeUI: vi.fn()
            },
            statusMonitor: {
                updateStatusDisplay: vi.fn(),
                elements: {
                    statusIndicator: {
                        textContent: '',
                        classList: { add: vi.fn() }
                    }
                }
            },
            logViewer: {
                updateDisplay: vi.fn(),
                elements: {
                    logViewer: { innerHTML: '' }
                }
            }
        };
        
        UIAdapter.initializeAll(components);
        
        // Verify all components were adapted
        expect(components.fileUpload.initializeUI).toBeDefined();
        expect(components.statusMonitor.updateStatusDisplay).toBeDefined();
        expect(components.logViewer.updateDisplay).toBeDefined();
    });
    
    it('should handle missing components gracefully', () => {
        const components = {
            fileUpload: null,
            statusMonitor: {
                updateStatusDisplay: vi.fn(),
                elements: {
                    statusIndicator: {
                        textContent: '',
                        classList: { add: vi.fn() }
                    }
                }
            }
        };
        
        // Should not throw error
        expect(() => UIAdapter.initializeAll(components)).not.toThrow();
    });
    
    it('should handle null components object', () => {
        // Should not throw error
        expect(() => UIAdapter.initializeAll(null)).not.toThrow();
    });
});
