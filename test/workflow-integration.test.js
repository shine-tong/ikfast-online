import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration tests for complete workflow
 * Tests the end-to-end user journey: upload → link info → configure → generate → download
 */

describe('Complete Workflow Integration Tests', () => {
    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
            <div id="app"></div>
            <div id="error-container"></div>
        `;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('File Upload Workflow', () => {
        it('should validate URDF file extension', async () => {
            const { FileUploadComponent } = await import('../web/file-upload.module.js');
            const component = new FileUploadComponent(document.getElementById('app'));

            // Test valid URDF file
            const validFile = new File(['<robot></robot>'], 'robot.urdf', { type: 'application/xml' });
            const validResult = component.validateFile(validFile);
            expect(validResult.valid).toBe(true);

            // Test invalid file extension
            const invalidFile = new File(['<robot></robot>'], 'robot.txt', { type: 'text/plain' });
            const invalidResult = component.validateFile(invalidFile);
            expect(invalidResult.valid).toBe(false);
            expect(invalidResult.error).toContain('.urdf');
        });

        it('should validate file size limits', async () => {
            const { FileUploadComponent } = await import('../web/file-upload.module.js');
            const component = new FileUploadComponent(document.getElementById('app'));

            // Test file within size limit (1MB)
            const smallFile = new File(['<robot></robot>'], 'robot.urdf', { type: 'application/xml' });
            const smallResult = component.validateFile(smallFile);
            expect(smallResult.valid).toBe(true);

            // Test file exceeding size limit (11MB)
            const largeContent = 'x'.repeat(11 * 1024 * 1024);
            const largeFile = new File([largeContent], 'robot.urdf', { type: 'application/xml' });
            const largeResult = component.validateFile(largeFile);
            expect(largeResult.valid).toBe(false);
            expect(largeResult.error).toContain('10MB');
        });

        it('should validate XML structure', async () => {
            const { FileUploadComponent } = await import('../web/file-upload.module.js');
            const component = new FileUploadComponent(document.getElementById('app'));

            // Test valid XML
            const validXML = new File(['<robot><link name="base"/></robot>'], 'robot.urdf', { type: 'application/xml' });
            const validResult = component.validateFile(validXML);
            expect(validResult.valid).toBe(true);

            // Test invalid XML
            const invalidXML = new File(['<robot><link name="base"'], 'robot.urdf', { type: 'application/xml' });
            const invalidResult = component.validateFile(invalidXML);
            expect(invalidResult.valid).toBe(false);
            expect(invalidResult.error).toContain('XML');
        });
    });

    describe('Link Information Workflow', () => {
        it('should parse link information from OpenRAVE output', async () => {
            const { LinkInfoComponent } = await import('../web/link-info.module.js');
            const component = new LinkInfoComponent(document.getElementById('app'));

            const openraveOutput = `
name index parents
base_link 0 
link1 1 base_link(0)
link2 2 link1(1)
ee_link 3 link2(2)
            `.trim();

            const links = component.parseLinkInfo(openraveOutput);
            
            expect(links).toHaveLength(4);
            expect(links[0]).toEqual({
                index: 0,
                name: 'base_link',
                parent: null,
                isRoot: true,
                isLeaf: false
            });
            expect(links[3]).toEqual({
                index: 3,
                name: 'ee_link',
                parent: 'link2',
                isLeaf: true,
                isRoot: false
            });
        });

        it('should identify root and leaf links', async () => {
            const { LinkInfoComponent } = await import('../web/link-info.module.js');
            const component = new LinkInfoComponent(document.getElementById('app'));

            const openraveOutput = `
name index parents
base_link 0 
link1 1 base_link(0)
ee_link 2 link1(1)
            `.trim();

            const links = component.parseLinkInfo(openraveOutput);
            
            const rootLinks = links.filter(l => l.isRoot);
            const leafLinks = links.filter(l => l.isLeaf);
            
            expect(rootLinks).toHaveLength(1);
            expect(rootLinks[0].name).toBe('base_link');
            expect(leafLinks).toHaveLength(1);
            expect(leafLinks[0].name).toBe('ee_link');
        });
    });

    describe('Parameter Configuration Workflow', () => {
        it('should validate parameter inputs', async () => {
            const { ParameterConfigComponent } = await import('../web/parameter-config.module.js');
            const component = new ParameterConfigComponent(document.getElementById('app'));

            // Test valid parameters
            const validParams = { baseLink: 0, eeLink: 3, ikType: 'transform6d' };
            const validResult = component.validateParameters(validParams);
            expect(validResult.valid).toBe(true);

            // Test invalid: base_link equals ee_link
            const sameLinks = { baseLink: 1, eeLink: 1, ikType: 'transform6d' };
            const sameResult = component.validateParameters(sameLinks);
            expect(sameResult.valid).toBe(false);
            expect(sameResult.errors).toContain('base_link 和 ee_link 不能相同');

            // Test invalid: negative index
            const negativeParams = { baseLink: -1, eeLink: 3, ikType: 'transform6d' };
            const negativeResult = component.validateParameters(negativeParams);
            expect(negativeResult.valid).toBe(false);
        });

        it('should have default iktype as transform6d', async () => {
            const { ParameterConfigComponent } = await import('../web/parameter-config.module.js');
            const component = new ParameterConfigComponent(document.getElementById('app'));

            const params = component.getParameters();
            expect(params.ikType).toBe('transform6d');
        });

        it('should support all IKFast types', async () => {
            const { ParameterConfigComponent } = await import('../web/parameter-config.module.js');
            const component = new ParameterConfigComponent(document.getElementById('app'));

            const supportedTypes = [
                'transform6d',
                'translation3d',
                'direction3d',
                'ray4d',
                'lookat3d',
                'translationdirection5d',
                'translationxy5d'
            ];

            supportedTypes.forEach(ikType => {
                const params = { baseLink: 0, eeLink: 3, ikType };
                const result = component.validateParameters(params);
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('Error Handling Workflow', () => {
        it('should handle validation errors', async () => {
            const { ValidationError } = await import('../web/error-handler.module.js');
            const { GlobalErrorHandler } = await import('../web/error-handler.module.js');
            
            const handler = new GlobalErrorHandler();
            const error = new ValidationError('Invalid input', 'testField', 'badValue');
            
            await handler.handleError(error);
            
            const errorMessage = document.querySelector('.error-message');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.textContent).toBe('Invalid input');
        });

        it('should handle network errors', async () => {
            const { NetworkError } = await import('../web/error-handler.module.js');
            const { GlobalErrorHandler } = await import('../web/error-handler.module.js');
            
            const handler = new GlobalErrorHandler();
            const error = new NetworkError('Connection failed', 500, null);
            
            await handler.handleError(error, { operation: 'test' });
            
            const errorMessage = document.querySelector('.error-message');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.textContent).toContain('网络连接失败');
        });

        it('should handle API errors with specific guidance', async () => {
            const { GitHubAPIError } = await import('../web/error-handler.module.js');
            const { GlobalErrorHandler } = await import('../web/error-handler.module.js');
            
            const handler = new GlobalErrorHandler();
            
            // Test 401 error
            const error401 = new GitHubAPIError('Unauthorized', 401, 'Bad credentials');
            await handler.handleError(error401, { operation: 'test' });
            let errorMessage = document.querySelector('.error-message');
            expect(errorMessage.textContent).toContain('认证失败');
            
            // Clear and test 404 error
            document.getElementById('error-container').innerHTML = '';
            const error404 = new GitHubAPIError('Not found', 404, 'Resource not found');
            await handler.handleError(error404, { operation: 'test' });
            errorMessage = document.querySelector('.error-message');
            expect(errorMessage.textContent).toContain('资源未找到');
        });
    });

    describe('Concurrent Access Prevention', () => {
        it('should prevent triggering workflow when one is already running', async () => {
            const { WorkflowTriggerComponent } = await import('../web/workflow-trigger.module.js');
            
            const mockAPI = {
                triggerWorkflow: vi.fn().mockResolvedValue({ runId: 123 }),
                getWorkflowRun: vi.fn().mockResolvedValue({
                    id: 123,
                    status: 'in_progress',
                    conclusion: null
                })
            };

            const component = new WorkflowTriggerComponent(
                document.getElementById('app'),
                mockAPI
            );

            // Simulate active workflow
            component.activeWorkflowId = 123;

            const canTrigger = await component.canTriggerWorkflow();
            expect(canTrigger).toBe(false);
        });

        it('should allow triggering workflow when none is running', async () => {
            const { WorkflowTriggerComponent } = await import('../web/workflow-trigger.module.js');
            
            const mockAPI = {
                triggerWorkflow: vi.fn().mockResolvedValue({ runId: 123 }),
                getWorkflowRun: vi.fn().mockResolvedValue({
                    id: 123,
                    status: 'completed',
                    conclusion: 'success'
                })
            };

            const component = new WorkflowTriggerComponent(
                document.getElementById('app'),
                mockAPI
            );

            const canTrigger = await component.canTriggerWorkflow();
            expect(canTrigger).toBe(true);
        });
    });

    describe('Download Workflow', () => {
        it('should enable download links only when workflow completes successfully', async () => {
            const { DownloadComponent } = await import('../web/download.module.js');
            
            const mockAPI = {
                listArtifacts: vi.fn().mockResolvedValue({
                    artifacts: [
                        {
                            id: 1,
                            name: 'ikfast-result',
                            size_in_bytes: 1024000,
                            archive_download_url: 'https://example.com/artifact.zip'
                        }
                    ]
                }),
                downloadArtifact: vi.fn().mockResolvedValue(new Blob(['test']))
            };

            const component = new DownloadComponent(
                document.getElementById('app'),
                mockAPI
            );

            // Test with completed workflow
            await component.updateDownloadLinks(123, 'completed', 'success');
            
            expect(mockAPI.listArtifacts).toHaveBeenCalledWith(123);
        });

        it('should not enable download links when workflow fails', async () => {
            const { DownloadComponent } = await import('../web/download.module.js');
            
            const mockAPI = {
                listArtifacts: vi.fn(),
                downloadArtifact: vi.fn()
            };

            const component = new DownloadComponent(
                document.getElementById('app'),
                mockAPI
            );

            // Test with failed workflow
            await component.updateDownloadLinks(123, 'completed', 'failure');
            
            // Should not call listArtifacts for failed workflows
            expect(mockAPI.listArtifacts).not.toHaveBeenCalled();
        });
    });

    describe('Status Monitoring Workflow', () => {
        it('should poll workflow status at appropriate intervals', async () => {
            const { StatusMonitorComponent } = await import('../web/status-monitor.module.js');
            
            let callCount = 0;
            const mockAPI = {
                getWorkflowRun: vi.fn().mockImplementation(() => {
                    callCount++;
                    return Promise.resolve({
                        id: 123,
                        status: callCount < 3 ? 'in_progress' : 'completed',
                        conclusion: callCount < 3 ? null : 'success'
                    });
                })
            };

            const component = new StatusMonitorComponent(
                document.getElementById('app'),
                mockAPI
            );

            // Start polling with short interval for testing
            component.minInterval = 100;
            component.startPolling(123);

            // Wait for a few polls
            await new Promise(resolve => setTimeout(resolve, 350));

            // Should have polled multiple times
            expect(callCount).toBeGreaterThan(1);

            // Stop polling
            component.stopPolling();
        });

        it('should stop polling when workflow completes', async () => {
            const { StatusMonitorComponent } = await import('../web/status-monitor.module.js');
            
            const mockAPI = {
                getWorkflowRun: vi.fn().mockResolvedValue({
                    id: 123,
                    status: 'completed',
                    conclusion: 'success'
                })
            };

            const component = new StatusMonitorComponent(
                document.getElementById('app'),
                mockAPI
            );

            component.minInterval = 100;
            component.startPolling(123);

            // Wait for poll to complete
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should have stopped polling
            expect(component.pollingInterval).toBeNull();
        });
    });

    describe('Log Viewer Workflow', () => {
        it('should append logs incrementally', async () => {
            const { LogViewerComponent } = await import('../web/log-viewer.module.js');
            
            const component = new LogViewerComponent(document.getElementById('app'));

            component.appendLog('First log line\n');
            component.appendLog('Second log line\n');

            const logContent = component.logContainer.textContent;
            expect(logContent).toContain('First log line');
            expect(logContent).toContain('Second log line');
        });

        it('should highlight STEP markers', async () => {
            const { LogViewerComponent } = await import('../web/log-viewer.module.js');
            
            const component = new LogViewerComponent(document.getElementById('app'));

            const logWithSteps = `
=== STEP 1: URDF to Collada ===
Processing...
=== STEP 2: Generate IKFast ===
Done
            `.trim();

            component.appendLog(logWithSteps);

            const stepElements = component.logContainer.querySelectorAll('.log-step');
            expect(stepElements.length).toBeGreaterThan(0);
        });
    });
});


describe('Complete Application Integration', () => {
    describe('End-to-End User Workflow', () => {
        it('should complete full workflow: upload → link info → configure → generate → download', async () => {
            // This test simulates the complete user journey
            
            // Mock GitHub API
            const mockAPI = {
                uploadFile: vi.fn().mockResolvedValue({ success: true, sha: 'abc123' }),
                triggerWorkflow: vi.fn().mockResolvedValue({ success: true }),
                getMostRecentWorkflowRun: vi.fn().mockResolvedValue({ id: 123, status: 'queued' }),
                getWorkflowRun: vi.fn()
                    .mockResolvedValueOnce({ id: 123, status: 'queued', conclusion: null })
                    .mockResolvedValueOnce({ id: 123, status: 'in_progress', conclusion: null })
                    .mockResolvedValue({ id: 123, status: 'completed', conclusion: 'success' }),
                listArtifacts: vi.fn().mockResolvedValue([
                    { id: 1, name: 'ikfast-result', sizeInBytes: 1024000 }
                ]),
                downloadArtifact: vi.fn().mockResolvedValue(new Blob(['test content'])),
                hasActiveWorkflow: vi.fn().mockResolvedValue(false)
            };

            // Import components
            const { FileUploadComponent } = await import('../web/file-upload.module.js');
            const { LinkInfoComponent } = await import('../web/link-info.module.js');
            const { ParameterConfigComponent } = await import('../web/parameter-config.module.js');
            const { WorkflowTriggerComponent } = await import('../web/workflow-trigger.module.js');
            const { StatusMonitorComponent } = await import('../web/status-monitor.module.js');
            const { DownloadComponent } = await import('../web/download.module.js');

            // Initialize components
            const fileUpload = new FileUploadComponent(mockAPI);
            const linkInfo = new LinkInfoComponent(mockAPI);
            const paramConfig = new ParameterConfigComponent();
            const workflowTrigger = new WorkflowTriggerComponent(mockAPI);
            const statusMonitor = new StatusMonitorComponent(mockAPI);
            const download = new DownloadComponent(mockAPI);

            // Step 1: Upload URDF file
            const urdfContent = '<robot><link name="base_link"/><link name="ee_link"/></robot>';
            const urdfFile = new File([urdfContent], 'robot.urdf', { type: 'application/xml' });
            
            const uploadValidation = fileUpload.validateFile(urdfFile);
            expect(uploadValidation.valid).toBe(true);

            // Step 2: Parse link information
            const linkOutput = `
name index parents
base_link 0 
link1 1 base_link(0)
ee_link 2 link1(1)
            `.trim();
            
            const links = linkInfo.parseLinkInfo(linkOutput);
            expect(links).toHaveLength(3);
            expect(links[0].isRoot).toBe(true);
            expect(links[2].isLeaf).toBe(true);

            // Step 3: Configure parameters
            paramConfig.setParameters({
                baseLink: 0,
                eeLink: 2,
                ikType: 'transform6d'
            });

            const paramValidation = paramConfig.validateParameters(paramConfig.getParameters());
            expect(paramValidation.valid).toBe(true);

            // Step 4: Trigger workflow
            const triggerResult = await workflowTrigger.triggerWorkflow({
                mode: 'generate',
                baseLink: 0,
                eeLink: 2,
                ikType: 'transform6d'
            });

            expect(triggerResult.success).toBe(true);
            expect(triggerResult.runId).toBe(123);

            // Step 5: Monitor status
            statusMonitor.startPolling(123);
            
            // Wait for status updates
            await new Promise(resolve => setTimeout(resolve, 100));
            
            statusMonitor.stopPolling();

            // Step 6: Download results
            download.setWorkflowStatus('completed', 123);
            const artifacts = await download.fetchArtifacts(123);
            
            expect(artifacts).toHaveLength(1);
            expect(artifacts[0].name).toBe('ikfast-result');
        });

        it('should handle workflow failure gracefully', async () => {
            const mockAPI = {
                uploadFile: vi.fn().mockResolvedValue({ success: true, sha: 'abc123' }),
                triggerWorkflow: vi.fn().mockResolvedValue({ success: true }),
                getMostRecentWorkflowRun: vi.fn().mockResolvedValue({ id: 123, status: 'queued' }),
                getWorkflowRun: vi.fn().mockResolvedValue({
                    id: 123,
                    status: 'completed',
                    conclusion: 'failure'
                }),
                hasActiveWorkflow: vi.fn().mockResolvedValue(false)
            };

            const { WorkflowTriggerComponent } = await import('../web/workflow-trigger.module.js');
            const { StatusMonitorComponent } = await import('../web/status-monitor.module.js');
            const { DownloadComponent } = await import('../web/download.module.js');

            const workflowTrigger = new WorkflowTriggerComponent(mockAPI);
            const statusMonitor = new StatusMonitorComponent(mockAPI);
            const download = new DownloadComponent(mockAPI);

            // Trigger workflow
            const triggerResult = await workflowTrigger.triggerWorkflow({
                mode: 'generate',
                baseLink: 0,
                eeLink: 2,
                ikType: 'transform6d'
            });

            expect(triggerResult.success).toBe(true);

            // Monitor status
            statusMonitor.startPolling(123);
            await new Promise(resolve => setTimeout(resolve, 100));
            statusMonitor.stopPolling();

            // Verify downloads are not enabled for failed workflow
            download.setWorkflowStatus('failed', 123);
            const downloadState = download.getArtifacts();
            expect(downloadState).toHaveLength(0);
        });
    });

    describe('State Management', () => {
        it('should maintain consistent state across components', async () => {
            const { ParameterConfigComponent } = await import('../web/parameter-config.module.js');
            const { WorkflowTriggerComponent } = await import('../web/workflow-trigger.module.js');

            const mockAPI = {
                triggerWorkflow: vi.fn().mockResolvedValue({ success: true }),
                getMostRecentWorkflowRun: vi.fn().mockResolvedValue({ id: 123 }),
                hasActiveWorkflow: vi.fn().mockResolvedValue(false)
            };

            const paramConfig = new ParameterConfigComponent();
            const workflowTrigger = new WorkflowTriggerComponent(mockAPI);

            // Set parameters
            paramConfig.setParameters({
                baseLink: 0,
                eeLink: 3,
                ikType: 'translation3d'
            });

            const params = paramConfig.getParameters();
            expect(params.baseLink).toBe(0);
            expect(params.eeLink).toBe(3);
            expect(params.ikType).toBe('translation3d');

            // Trigger workflow with these parameters
            await workflowTrigger.triggerWorkflow({
                mode: 'generate',
                ...params
            });

            expect(mockAPI.triggerWorkflow).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    mode: 'generate',
                    base_link: '0',
                    ee_link: '3',
                    iktype: 'translation3d'
                }),
                'main'
            );
        });

        it('should handle component reset correctly', async () => {
            const { ParameterConfigComponent } = await import('../web/parameter-config.module.js');
            const { WorkflowTriggerComponent } = await import('../web/workflow-trigger.module.js');

            const mockAPI = {
                hasActiveWorkflow: vi.fn().mockResolvedValue(false)
            };

            const paramConfig = new ParameterConfigComponent();
            const workflowTrigger = new WorkflowTriggerComponent(mockAPI);

            // Set some state
            paramConfig.setParameters({ baseLink: 1, eeLink: 5, ikType: 'ray4d' });
            workflowTrigger.setWorkflowActive(true, 123);

            // Reset components
            paramConfig.reset();
            workflowTrigger.reset();

            // Verify reset state
            const params = paramConfig.getParameters();
            expect(params.baseLink).toBeNull();
            expect(params.eeLink).toBeNull();
            expect(params.ikType).toBe('transform6d');

            const workflowState = workflowTrigger.getWorkflowState();
            expect(workflowState.isActive).toBe(false);
            expect(workflowState.runId).toBeNull();
        });
    });

    describe('Error Recovery Flows', () => {
        it('should recover from network errors with retry', async () => {
            const { GlobalErrorHandler } = await import('../web/error-handler.module.js');
            const { NetworkError } = await import('../web/github-api.module.js');

            const handler = new GlobalErrorHandler();
            let attemptCount = 0;

            const retryOperation = vi.fn().mockImplementation(async () => {
                attemptCount++;
                if (attemptCount < 2) {
                    throw new NetworkError('Connection failed', 500, null);
                }
                return { success: true };
            });

            // First attempt should fail
            try {
                await retryOperation();
            } catch (error) {
                await handler.handleError(error, {
                    operation: 'test-retry',
                    retry: retryOperation
                });
            }

            // Verify retry button is shown
            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeTruthy();

            // Simulate retry click
            if (retryButton) {
                retryButton.click();
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Should have retried
            expect(attemptCount).toBeGreaterThan(1);
        });

        it('should handle validation errors without retry', async () => {
            const { GlobalErrorHandler } = await import('../web/error-handler.module.js');
            const { ValidationError } = await import('../web/github-api.module.js');

            const handler = new GlobalErrorHandler();
            const error = new ValidationError('Invalid parameter', 'baseLink', -1);

            await handler.handleError(error);

            // Verify no retry button for validation errors
            const retryButton = document.querySelector('.error-retry-button');
            expect(retryButton).toBeFalsy();

            // Verify error message is shown
            const errorMessage = document.querySelector('.error-message');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.textContent).toContain('Invalid parameter');
        });
    });

    describe('State Transitions', () => {
        it('should transition through workflow states correctly', async () => {
            const { StatusMonitorComponent } = await import('../web/status-monitor.module.js');

            const states = ['queued', 'in_progress', 'completed'];
            let stateIndex = 0;

            const mockAPI = {
                getWorkflowRun: vi.fn().mockImplementation(() => {
                    const currentState = states[stateIndex];
                    const result = {
                        id: 123,
                        status: currentState,
                        conclusion: currentState === 'completed' ? 'success' : null
                    };
                    stateIndex = Math.min(stateIndex + 1, states.length - 1);
                    return Promise.resolve(result);
                })
            };

            const statusMonitor = new StatusMonitorComponent(mockAPI);
            const stateChanges = [];

            statusMonitor.onStatusChange = (status) => {
                stateChanges.push(status);
            };

            statusMonitor.startPolling(123);

            // Wait for state transitions
            await new Promise(resolve => setTimeout(resolve, 300));

            statusMonitor.stopPolling();

            // Verify state transitions occurred
            expect(stateChanges.length).toBeGreaterThan(0);
            expect(stateChanges).toContain('queued');
        });

        it('should handle state transition from queued to failed', async () => {
            const { StatusMonitorComponent } = await import('../web/status-monitor.module.js');

            const mockAPI = {
                getWorkflowRun: vi.fn()
                    .mockResolvedValueOnce({ id: 123, status: 'queued', conclusion: null })
                    .mockResolvedValue({ id: 123, status: 'completed', conclusion: 'failure' })
            };

            const statusMonitor = new StatusMonitorComponent(mockAPI);
            let finalStatus = null;

            statusMonitor.onComplete = (status) => {
                finalStatus = status;
            };

            statusMonitor.startPolling(123);

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 200));

            statusMonitor.stopPolling();

            expect(finalStatus).toBe('failed');
        });
    });
});
