/**
 * Property-based tests for StatusMonitorComponent
 * Tests Property 17: Status Polling and Property 18: Status Display Mapping
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 13.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { StatusMonitorComponent } from '../web/status-monitor.module.js';

// Mock CONFIG for tests
global.CONFIG = {
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

describe('StatusMonitorComponent - Property Tests', () => {
    let mockGitHubAPI;
    let component;
    
    beforeEach(() => {
        // Mock GitHub API client
        mockGitHubAPI = {
            getWorkflowRun: vi.fn()
        };
        
        component = new StatusMonitorComponent(mockGitHubAPI);
    });
    
    afterEach(() => {
        component.stopPolling();
        vi.restoreAllMocks();
    });
    
    /**
     * Property 17: Status Polling
     * For any triggered workflow, the system should poll the GitHub API 
     * for status updates at intervals of at least 5 seconds until the 
     * workflow reaches a terminal state
     */
    describe('Property 17: Status Polling', () => {
        it('should enforce minimum polling interval of 5 seconds', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1000, max: 99999 }),
                    fc.integer({ min: 1000, max: 10000 }),
                    async (runId, requestedInterval) => {
                        // Start polling with requested interval
                        component.startPolling(runId, requestedInterval);
                        
                        // Get the actual interval being used
                        const state = component.getPollingState();
                        
                        // Stop polling
                        component.stopPolling();
                        
                        // Verify minimum interval is enforced
                        expect(state.currentInterval).toBeGreaterThanOrEqual(5000);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should stop polling when workflow reaches completed status', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1000, max: 99999 }),
                    fc.constantFrom('success', 'failure', 'cancelled'),
                    async (runId, conclusion) => {
                        // Create a fresh component and mock for each test
                        const testMockAPI = {
                            getWorkflowRun: vi.fn().mockResolvedValue({
                                id: runId,
                                status: 'completed',
                                conclusion: conclusion,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                runNumber: 1
                            })
                        };
                        
                        const testComponent = new StatusMonitorComponent(testMockAPI);
                        
                        // Track completion callback
                        let completeCalled = false;
                        testComponent.onComplete = () => {
                            completeCalled = true;
                        };
                        
                        // Start polling
                        testComponent.startPolling(runId);
                        
                        // Wait for polling to complete (give it enough time)
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Verify completion callback was called
                        expect(completeCalled).toBe(true);
                        
                        // Verify polling stopped
                        const state = testComponent.getPollingState();
                        expect(state.isPolling).toBe(false);
                        
                        // Clean up
                        testComponent.stopPolling();
                    }
                ),
                { numRuns: 20 }
            );
        }, 15000);
        
        it('should not exceed maximum polling interval', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1000, max: 99999 }),
                    async (runId) => {
                        // Start polling
                        component.startPolling(runId);
                        
                        // Simulate many polls to trigger backoff
                        component.pollCount = 100;
                        component.scheduleNextPoll();
                        
                        // Get the interval
                        const state = component.getPollingState();
                        
                        // Stop polling
                        component.stopPolling();
                        
                        // Verify interval doesn't exceed maximum
                        expect(state.currentInterval).toBeLessThanOrEqual(30000);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
    
    /**
     * Property 18: Status Display Mapping
     * For any workflow status retrieved from the API, the system should 
     * display one of the valid states: "queued", "in_progress", "completed", or "failed"
     */
    describe('Property 18: Status Display Mapping', () => {
        it('should map all GitHub workflow statuses to valid display states', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        status: fc.constantFrom('queued', 'in_progress', 'completed'),
                        conclusion: fc.option(fc.constantFrom('success', 'failure', 'cancelled', 'skipped'), { nil: null })
                    }),
                    async (workflowStatus) => {
                        // Map the status
                        const mappedStatus = component.mapStatus(workflowStatus.status, workflowStatus.conclusion);
                        
                        // Verify mapped status is one of the valid states
                        const validStates = ['queued', 'in_progress', 'completed', 'failed', 'cancelled', 'unknown'];
                        expect(validStates).toContain(mappedStatus);
                        
                        // Verify specific mappings
                        if (workflowStatus.status === 'queued') {
                            expect(mappedStatus).toBe('queued');
                        } else if (workflowStatus.status === 'in_progress') {
                            expect(mappedStatus).toBe('in_progress');
                        } else if (workflowStatus.status === 'completed') {
                            if (workflowStatus.conclusion === 'success') {
                                expect(mappedStatus).toBe('completed');
                            } else if (workflowStatus.conclusion === 'failure') {
                                expect(mappedStatus).toBe('failed');
                            } else if (workflowStatus.conclusion === 'cancelled') {
                                expect(mappedStatus).toBe('cancelled');
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should map queued status correctly', async () => {
            const mapped = component.mapStatus('queued', null);
            expect(mapped).toBe('queued');
        });
        
        it('should map in_progress status correctly', async () => {
            const mapped = component.mapStatus('in_progress', null);
            expect(mapped).toBe('in_progress');
        });
        
        it('should map completed with success conclusion correctly', async () => {
            const mapped = component.mapStatus('completed', 'success');
            expect(mapped).toBe('completed');
        });
        
        it('should map completed with failure conclusion correctly', async () => {
            const mapped = component.mapStatus('completed', 'failure');
            expect(mapped).toBe('failed');
        });
        
        it('should map completed with cancelled conclusion correctly', async () => {
            const mapped = component.mapStatus('completed', 'cancelled');
            expect(mapped).toBe('cancelled');
        });
    });
});

// Tag: Feature: ikfast-online-generator, Property 17: Status polling
// Tag: Feature: ikfast-online-generator, Property 18: Status display mapping
