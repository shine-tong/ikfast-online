/**
 * Unit tests for WorkflowTriggerComponent and StatusMonitorComponent
 * Tests workflow triggering, polling, timeout handling, and status updates
 * Requirements: 4.1, 5.1, 5.5, 18.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowTriggerComponent } from '../web/workflow-trigger.module.js';
import { StatusMonitorComponent } from '../web/status-monitor.module.js';

// Mock CONFIG for tests
global.CONFIG = {
    WORKFLOW_FILE: 'ikfast.yml',
    POLLING_INTERVAL: 5000,
    POLLING_MAX_INTERVAL: 30000,
    POLLING_TIMEOUT: 1800000,
    STATUS_MESSAGES: {
        NOT_STARTED: '未开始',
        QUEUED: '排队中',
        IN_PROGRESS: '执行中',
        COMPLETED: '已完成',
        FAILED: '失败',
        CANCELLED: '已取消'
    }
};

describe('WorkflowTriggerComponent - Unit Tests', () => {
    let mockGitHubAPI;
    let component;
    
    beforeEach(() => {
        mockGitHubAPI = {
            triggerWorkflow: vi.fn(),
            hasActiveWorkflow: vi.fn(),
            getMostRecentWorkflowRun: vi.fn()
        };
        
        component = new WorkflowTriggerComponent(mockGitHubAPI);
        component.sleep = vi.fn().mockResolvedValue(undefined);
    });
    
    describe('Workflow Triggering', () => {
        it('should trigger workflow with generate mode parameters', async () => {
            mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(false);
            mockGitHubAPI.triggerWorkflow.mockResolvedValue({ success: true });
            mockGitHubAPI.getMostRecentWorkflowRun.mockResolvedValue({
                id: 12345,
                status: 'queued'
            });
            
            const result = await component.triggerWorkflow({
                mode: 'generate',
                baseLink: 1,
                eeLink: 8,
                ikType: 'transform6d'
            });
            
            expect(result.success).toBe(true);
            expect(result.runId).toBe(12345);
            expect(mockGitHubAPI.triggerWorkflow).toHaveBeenCalledWith(
                'ikfast.yml',
                {
                    mode: 'generate',
                    base_link: '1',
                    ee_link: '8',
                    iktype: 'transform6d'
                },
                'main'
            );
        });
        
        it('should trigger workflow with info mode', async () => {
            mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(false);
            mockGitHubAPI.triggerWorkflow.mockResolvedValue({ success: true });
            mockGitHubAPI.getMostRecentWorkflowRun.mockResolvedValue({
                id: 12345,
                status: 'queued'
            });
            
            const result = await component.triggerWorkflow({
                mode: 'info'
            });
            
            expect(result.success).toBe(true);
            expect(mockGitHubAPI.triggerWorkflow).toHaveBeenCalledWith(
                'ikfast.yml',
                { mode: 'info' },
                'main'
            );
        });
        
        it('should prevent triggering when workflow is active', async () => {
            mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(true);
            
            const result = await component.triggerWorkflow({
                mode: 'generate',
                baseLink: 1,
                eeLink: 8
            });
            
            expect(result.success).toBe(false);
            expect(mockGitHubAPI.triggerWorkflow).not.toHaveBeenCalled();
        });
        
        it('should check for active workflows', async () => {
            mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(true);
            
            const hasActive = await component.checkActiveWorkflow();
            
            expect(hasActive).toBe(true);
            expect(component.getWorkflowState().isActive).toBe(true);
        });
    });
    
    describe('UI State Management', () => {
        it('should disable submit button when workflow is active', () => {
            const mockElements = {
                submitButton: {
                    disabled: false,
                    textContent: '生成 IKFast 求解器',
                    addEventListener: vi.fn()
                },
                statusMessage: {
                    textContent: '',
                    className: '',
                    style: { display: 'none' }
                }
            };
            
            component.initializeUI(mockElements);
            component.setWorkflowActive(true, 12345);
            
            expect(mockElements.submitButton.disabled).toBe(true);
        });
        
        it('should enable submit button when workflow is not active', () => {
            const mockElements = {
                submitButton: {
                    disabled: true,
                    textContent: '工作流执行中...',
                    addEventListener: vi.fn()
                },
                statusMessage: {
                    textContent: '',
                    className: '',
                    style: { display: 'none' }
                }
            };
            
            component.initializeUI(mockElements);
            component.setWorkflowActive(false, null);
            
            expect(mockElements.submitButton.disabled).toBe(false);
        });
    });
});

describe('StatusMonitorComponent - Unit Tests', () => {
    let mockGitHubAPI;
    let component;
    
    beforeEach(() => {
        mockGitHubAPI = {
            getWorkflowRun: vi.fn()
        };
        
        component = new StatusMonitorComponent(mockGitHubAPI);
    });
    
    afterEach(() => {
        component.stopPolling();
    });
    
    describe('Polling Start/Stop', () => {
        it('should start polling with minimum interval', () => {
            component.startPolling(12345, 3000);
            
            const state = component.getPollingState();
            expect(state.isPolling).toBe(true);
            expect(state.runId).toBe(12345);
            expect(state.currentInterval).toBeGreaterThanOrEqual(5000);
        });
        
        it('should stop polling', () => {
            component.startPolling(12345);
            component.stopPolling();
            
            const state = component.getPollingState();
            expect(state.isPolling).toBe(false);
        });
    });
    
    describe('Status Mapping', () => {
        it('should map queued status', () => {
            const mapped = component.mapStatus('queued', null);
            expect(mapped).toBe('queued');
        });
        
        it('should map in_progress status', () => {
            const mapped = component.mapStatus('in_progress', null);
            expect(mapped).toBe('in_progress');
        });
        
        it('should map completed with success', () => {
            const mapped = component.mapStatus('completed', 'success');
            expect(mapped).toBe('completed');
        });
        
        it('should map completed with failure', () => {
            const mapped = component.mapStatus('completed', 'failure');
            expect(mapped).toBe('failed');
        });
        
        it('should map completed with cancelled', () => {
            const mapped = component.mapStatus('completed', 'cancelled');
            expect(mapped).toBe('cancelled');
        });
    });
    
    describe('Status Updates', () => {
        it('should update status display', () => {
            const mockElements = {
                statusIndicator: {
                    className: '',
                    textContent: ''
                },
                queuePosition: {
                    textContent: '',
                    style: { display: 'none' }
                },
                elapsedTime: {
                    textContent: ''
                }
            };
            
            component.initializeUI(mockElements);
            component.updateStatusDisplay('in_progress');
            
            expect(mockElements.statusIndicator.className).toContain('in_progress');
        });
        
        it('should call onStatusChange callback when status changes', async () => {
            const statusChanges = [];
            component.onStatusChange = (status) => statusChanges.push(status);
            
            mockGitHubAPI.getWorkflowRun.mockResolvedValue({
                id: 12345,
                status: 'in_progress',
                conclusion: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                runNumber: 1
            });
            
            component.startPolling(12345);
            await new Promise(resolve => setTimeout(resolve, 100));
            component.stopPolling();
            
            expect(statusChanges.length).toBeGreaterThan(0);
            expect(statusChanges[0]).toBe('in_progress');
        });
    });
    
    describe('Timeout Handling', () => {
        it('should call onTimeout callback after timeout', () => {
            let timeoutCalled = false;
            component.onTimeout = () => {
                timeoutCalled = true;
            };
            
            // Simulate timeout by setting start time in the past
            component.startTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
            component.handleTimeout();
            
            expect(timeoutCalled).toBe(true);
        });
    });
});
