/**
 * Property-based tests for WorkflowTriggerComponent
 * Tests Property 13: Workflow Dispatch with Parameters
 * Validates: Requirements 4.1, 4.4, 17.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { WorkflowTriggerComponent } from '../web/workflow-trigger.module.js';

describe('WorkflowTriggerComponent - Property Tests', () => {
    let mockGitHubAPI;
    let component;
    
    beforeEach(() => {
        // Mock GitHub API client
        mockGitHubAPI = {
            triggerWorkflow: vi.fn(),
            hasActiveWorkflow: vi.fn(),
            getMostRecentWorkflowRun: vi.fn()
        };
        
        component = new WorkflowTriggerComponent(mockGitHubAPI);
        
        // Mock the sleep function to avoid delays
        component.sleep = vi.fn().mockResolvedValue(undefined);
    });
    
    /**
     * Property 13: Workflow Dispatch with Parameters
     * For any valid parameter set (base_link, ee_link, iktype), 
     * the system should trigger a workflow dispatch with mode="generate" 
     * and pass all parameters correctly
     */
    describe('Property 13: Workflow Dispatch with Parameters', () => {
        it('should trigger workflow with correct parameters for generate mode', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        baseLink: fc.integer({ min: 0, max: 20 }),
                        eeLink: fc.integer({ min: 0, max: 20 }),
                        ikType: fc.constantFrom(
                            'transform6d',
                            'translation3d',
                            'direction3d',
                            'ray4d',
                            'lookat3d',
                            'translationdirection5d',
                            'translationxy5d'
                        )
                    }).filter(params => params.baseLink !== params.eeLink),
                    async (params) => {
                        // Create fresh component for each test
                        const freshComponent = new WorkflowTriggerComponent(mockGitHubAPI);
                        freshComponent.sleep = vi.fn().mockResolvedValue(undefined);
                        
                        // Reset mocks
                        mockGitHubAPI.triggerWorkflow.mockClear();
                        mockGitHubAPI.hasActiveWorkflow.mockClear();
                        mockGitHubAPI.getMostRecentWorkflowRun.mockClear();
                        
                        // Setup mocks
                        mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(false);
                        mockGitHubAPI.triggerWorkflow.mockResolvedValue({ success: true });
                        mockGitHubAPI.getMostRecentWorkflowRun.mockResolvedValue({
                            id: 12345,
                            status: 'queued'
                        });
                        
                        // Trigger workflow
                        const result = await freshComponent.triggerWorkflow({
                            mode: 'generate',
                            baseLink: params.baseLink,
                            eeLink: params.eeLink,
                            ikType: params.ikType
                        });
                        
                        // Verify workflow was triggered
                        expect(result.success).toBe(true);
                        
                        // Verify triggerWorkflow was called with correct parameters
                        expect(mockGitHubAPI.triggerWorkflow).toHaveBeenCalledWith(
                            expect.any(String), // workflow file
                            {
                                mode: 'generate',
                                base_link: String(params.baseLink),
                                ee_link: String(params.eeLink),
                                iktype: params.ikType
                            },
                            'main'
                        );
                        
                        // Verify parameters are passed as strings
                        const callArgs = mockGitHubAPI.triggerWorkflow.mock.calls[0][1];
                        expect(typeof callArgs.base_link).toBe('string');
                        expect(typeof callArgs.ee_link).toBe('string');
                        expect(callArgs.base_link).toBe(String(params.baseLink));
                        expect(callArgs.ee_link).toBe(String(params.eeLink));
                        expect(callArgs.iktype).toBe(params.ikType);
                    }
                ),
                { numRuns: 100 }
            );
        }, 30000);
        
        it('should trigger workflow with correct parameters for info mode', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constant({}),
                    async () => {
                        // Create fresh component for each test
                        const freshComponent = new WorkflowTriggerComponent(mockGitHubAPI);
                        freshComponent.sleep = vi.fn().mockResolvedValue(undefined);
                        
                        // Reset mocks
                        mockGitHubAPI.triggerWorkflow.mockClear();
                        mockGitHubAPI.hasActiveWorkflow.mockClear();
                        mockGitHubAPI.getMostRecentWorkflowRun.mockClear();
                        
                        // Setup mocks
                        mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(false);
                        mockGitHubAPI.triggerWorkflow.mockResolvedValue({ success: true });
                        mockGitHubAPI.getMostRecentWorkflowRun.mockResolvedValue({
                            id: 12345,
                            status: 'queued'
                        });
                        
                        // Trigger workflow in info mode
                        const result = await freshComponent.triggerWorkflow({
                            mode: 'info'
                        });
                        
                        // Verify workflow was triggered
                        expect(result.success).toBe(true);
                        
                        // Verify triggerWorkflow was called with correct parameters
                        expect(mockGitHubAPI.triggerWorkflow).toHaveBeenCalledWith(
                            expect.any(String),
                            {
                                mode: 'info'
                            },
                            'main'
                        );
                        
                        // Verify no base_link or ee_link parameters for info mode
                        const callArgs = mockGitHubAPI.triggerWorkflow.mock.calls[0][1];
                        expect(callArgs.base_link).toBeUndefined();
                        expect(callArgs.ee_link).toBeUndefined();
                    }
                ),
                { numRuns: 100 }
            );
        }, 30000);
        
        it('should use default iktype when not specified', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        baseLink: fc.integer({ min: 0, max: 20 }),
                        eeLink: fc.integer({ min: 0, max: 20 })
                    }).filter(params => params.baseLink !== params.eeLink),
                    async (params) => {
                        // Create fresh component for each test
                        const freshComponent = new WorkflowTriggerComponent(mockGitHubAPI);
                        freshComponent.sleep = vi.fn().mockResolvedValue(undefined);
                        
                        // Reset mocks
                        mockGitHubAPI.triggerWorkflow.mockClear();
                        mockGitHubAPI.hasActiveWorkflow.mockClear();
                        mockGitHubAPI.getMostRecentWorkflowRun.mockClear();
                        
                        // Setup mocks
                        mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(false);
                        mockGitHubAPI.triggerWorkflow.mockResolvedValue({ success: true });
                        mockGitHubAPI.getMostRecentWorkflowRun.mockResolvedValue({
                            id: 12345,
                            status: 'queued'
                        });
                        
                        // Trigger workflow without ikType
                        await freshComponent.triggerWorkflow({
                            mode: 'generate',
                            baseLink: params.baseLink,
                            eeLink: params.eeLink
                        });
                        
                        // Verify default iktype is used
                        const callArgs = mockGitHubAPI.triggerWorkflow.mock.calls[0][1];
                        expect(callArgs.iktype).toBe('transform6d');
                    }
                ),
                { numRuns: 100 }
            );
        }, 30000);
    });
    
    /**
     * Property 32: Concurrent Workflow Prevention
     * For any user attempting to trigger a new workflow, 
     * if a workflow is currently running, the system should disable 
     * the submit button and display a message indicating a workflow is in progress
     */
    describe('Property 32: Concurrent Workflow Prevention', () => {
        it('should prevent triggering when workflow is active', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        baseLink: fc.integer({ min: 0, max: 20 }),
                        eeLink: fc.integer({ min: 0, max: 20 }),
                        ikType: fc.constantFrom('transform6d', 'translation3d')
                    }).filter(params => params.baseLink !== params.eeLink),
                    async (params) => {
                        // Reset mocks
                        mockGitHubAPI.triggerWorkflow.mockReset();
                        mockGitHubAPI.hasActiveWorkflow.mockReset();
                        
                        // Setup mock to indicate active workflow
                        mockGitHubAPI.hasActiveWorkflow.mockResolvedValue(true);
                        
                        // Attempt to trigger workflow
                        const result = await component.triggerWorkflow({
                            mode: 'generate',
                            baseLink: params.baseLink,
                            eeLink: params.eeLink,
                            ikType: params.ikType
                        });
                        
                        // Verify workflow was NOT triggered
                        expect(result.success).toBe(false);
                        expect(mockGitHubAPI.triggerWorkflow).not.toHaveBeenCalled();
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        it('should update UI state when workflow is active', async () => {
            // Setup UI elements
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
            
            // Set workflow as active
            component.setWorkflowActive(true, 12345);
            
            // Verify button is disabled
            expect(mockElements.submitButton.disabled).toBe(true);
            expect(mockElements.submitButton.textContent).toContain('执行中');
        });
        
        it('should enable UI when workflow is not active', async () => {
            // Setup UI elements
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
            
            // Set workflow as inactive
            component.setWorkflowActive(false, null);
            
            // Verify button is enabled
            expect(mockElements.submitButton.disabled).toBe(false);
            expect(mockElements.submitButton.textContent).toContain('生成');
        });
    });
});

// Tag: Feature: ikfast-online-generator, Property 13: Workflow dispatch with parameters
// Tag: Feature: ikfast-online-generator, Property 32: Concurrent workflow prevention
