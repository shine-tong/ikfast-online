/**
 * Main entry point for IKFast Online Generator
 * This file initializes the application and sets up event listeners
 * Integrates all components and manages application state
 */

// Import configuration
import { CONFIG } from './config.js';

// Import all required modules
import { AuthenticationManager } from './modules/auth.module.js';
import { GitHubAPIClient } from './modules/github-api.module.js';
import { FileUploadComponent } from './modules/file-upload.module.js';
import { LinkInfoComponent } from './modules/link-info.module.js';
import { ParameterConfigComponent } from './modules/parameter-config.module.js';
import { WorkflowTriggerComponent } from './modules/workflow-trigger.module.js';
import { StatusMonitorComponent } from './modules/status-monitor.module.js';
import { LogViewerComponent } from './modules/log-viewer.module.js';
import { DownloadComponent } from './modules/download.module.js';
import { GlobalErrorHandler } from './modules/error-handler.module.js';

// Initialize AuthenticationManager
const authManager = new AuthenticationManager();

// Initialize GitHubAPIClient
const githubAPI = new GitHubAPIClient(authManager);

// Initialize all components
const fileUploadComponent = new FileUploadComponent(githubAPI);
const linkInfoComponent = new LinkInfoComponent(githubAPI);
const parameterConfigComponent = new ParameterConfigComponent();
const workflowTriggerComponent = new WorkflowTriggerComponent(githubAPI);
const statusMonitorComponent = new StatusMonitorComponent(githubAPI);
const logViewerComponent = new LogViewerComponent(githubAPI);
const downloadComponent = new DownloadComponent(githubAPI);
const errorHandler = new GlobalErrorHandler();

// Initialize UI enhancement components
let navigationManager = null;
let animationManager = null;

// Application State
const AppState = {
    // Authentication state (managed by AuthenticationManager)
    get auth() {
        return {
            token: authManager.getToken(),
            isAuthenticated: authManager.isUserAuthenticated(),
            scopes: authManager.getScopes()
        };
    },
    
    // File state
    file: {
        uploaded: false,
        filename: null,
        size: 0,
        sha: null
    },
    
    // Link information
    links: [],
    
    // Parameter configuration
    parameters: {
        baseLink: null,
        eeLink: null,
        ikType: CONFIG.DEFAULT_IKTYPE
    },
    
    // Workflow state
    workflow: {
        runId: null,
        status: null,
        conclusion: null,
        startTime: null,
        endTime: null
    },
    
    // Logs
    logs: '',
    
    // Artifacts
    artifacts: []
};

// DOM Elements
const elements = {
    // Authentication
    githubToken: document.getElementById('github-token'),
    authButton: document.getElementById('auth-button'),
    authSection: document.getElementById('auth-section'),
    authMessage: document.getElementById('auth-message'),
    
    // File Upload
    fileInput: document.getElementById('file-input'),
    uploadButton: document.getElementById('upload-button'),
    uploadProgress: document.getElementById('upload-progress'),
    fileInfo: document.getElementById('file-info'),
    
    // Link Information
    linkTableContainer: document.getElementById('link-table-container'),
    
    // Parameters
    baseLinkInput: document.getElementById('base-link'),
    eeLinkInput: document.getElementById('ee-link'),
    iktypeSelect: document.getElementById('iktype'),
    submitButton: document.getElementById('submit-button'),
    
    // Status
    statusIndicator: document.getElementById('status-indicator'),
    statusMessage: document.getElementById('status-message'),
    
    // Logs
    logViewer: document.getElementById('log-viewer'),
    logContent: document.getElementById('log-content'),
    autoScroll: document.getElementById('auto-scroll'),
    
    // Download
    downloadSolver: document.getElementById('download-solver'),
    downloadLog: document.getElementById('download-log'),
    solverSize: document.getElementById('solver-size'),
    logSize: document.getElementById('log-size'),
    
    // Error
    errorSection: document.getElementById('error-section'),
    errorText: document.getElementById('error-text'),
    retryButton: document.getElementById('retry-button'),
    dismissError: document.getElementById('dismiss-error')
};

/**
 * Initialize the application
 */
function initializeApp() {
    
    // Add resource loading error listener
    setupResourceErrorHandling();
    
    // Check browser compatibility
    checkBrowserCompatibility();
    
    // Initialize AuthenticationManager with UI elements
    authManager.initializeUI({
        tokenInput: elements.githubToken,
        authButton: elements.authButton,
        authSection: elements.authSection,
        errorDisplay: elements.authMessage
    });
    
    // Initialize all components with their UI elements
    initializeComponents();
    
    // Initialize NavigationManager for enhanced navigation
    try {
        if (typeof NavigationManager !== 'undefined') {
            navigationManager = new NavigationManager();
            navigationManager.initialize();
        } else {
            console.warn('NavigationManager not available');
        }
    } catch (error) {
        console.error('Failed to initialize NavigationManager:', error);
        handleModuleIntegrationError('NavigationManager', error);
    }
    
    // Initialize AnimationManager for enhanced animations
    try {
        if (typeof AnimationManager !== 'undefined') {
            animationManager = new AnimationManager();
            animationManager.initialize();
        } else {
            console.warn('AnimationManager not available');
        }
    } catch (error) {
        console.error('Failed to initialize AnimationManager:', error);
        handleModuleIntegrationError('AnimationManager', error);
    }
    
    // Adapt existing components to new UI using UIAdapter
    try {
        if (typeof UIAdapter !== 'undefined') {
            UIAdapter.initializeAll({
                fileUpload: fileUploadComponent,
                statusMonitor: statusMonitorComponent,
                logViewer: logViewerComponent
            });
        } else {
            console.warn('UIAdapter not available');
        }
    } catch (error) {
        console.error('Failed to apply UI adaptations:', error);
        handleModuleIntegrationError('UIAdapter', error);
    }
    
    // Set up event listeners and data flow
    setupEventListeners();
    
    // Set up component event handlers
    setupComponentEventHandlers();
    
    // Initialize UI state
    updateUIState();
}

/**
 * Initialize all components with their UI elements
 */
function initializeComponents() {
    // File Upload Component
    fileUploadComponent.initializeUI({
        fileInput: elements.fileInput,
        uploadButton: elements.uploadButton,
        progressBar: document.querySelector('#upload-progress .progress-fill'),
        progressText: elements.fileInfo,
        fileInfo: elements.fileInfo,
        errorDisplay: elements.errorSection // Use global error section
    });
    
    // Link Info Component
    linkInfoComponent.initializeUI({
        linkTable: elements.linkTableContainer,
        linkTableContainer: elements.linkTableContainer,
        loadingIndicator: document.createElement('div'), // Will show loading state
        statusDisplay: document.createElement('div'),
        errorDisplay: document.createElement('div')
    });
    
    // Parameter Config Component
    parameterConfigComponent.initializeUI({
        baseLinkInput: elements.baseLinkInput,
        eeLinkInput: elements.eeLinkInput,
        ikTypeSelect: elements.iktypeSelect,
        baseLinkError: document.createElement('div'),
        eeLinkError: document.createElement('div'),
        ikTypeError: document.createElement('div')
    });
    
    // Workflow Trigger Component
    workflowTriggerComponent.initializeUI({
        submitButton: elements.submitButton,
        statusMessage: elements.statusMessage
    });
    
    // Status Monitor Component
    statusMonitorComponent.initializeUI({
        statusIndicator: elements.statusIndicator,
        queuePosition: document.createElement('div'),
        elapsedTime: document.createElement('div'),
        runDetails: document.createElement('div')
    });
    
    // Log Viewer Component
    logViewerComponent.initializeUI({
        logViewer: elements.logContent,
        autoScrollToggle: elements.autoScroll
    });
    
    // Download Component
    downloadComponent.initializeUI({
        downloadSolverButton: elements.downloadSolver,
        downloadLogButton: elements.downloadLog,
        solverFileSize: elements.solverSize,
        logFileSize: elements.logSize,
        downloadSection: document.querySelector('.download-section'),
        artifactInfo: document.createElement('div'),
        errorDisplay: document.createElement('div')
    });
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Authentication is handled by AuthenticationManager
    // Listen for authentication success event
    window.addEventListener('authenticationSuccess', (event) => {
        updateUIState();
    });
    
    // File Upload - handled by FileUploadComponent
    // But we need to listen for the fileUploaded event
    window.addEventListener('fileUploaded', handleFileUploaded);
    
    // Link Selection - handled by LinkInfoComponent
    window.addEventListener('linkSelected', handleLinkSelected);
    
    // Parameters - validation is handled by ParameterConfigComponent
    elements.baseLinkInput.addEventListener('input', handleParameterChange);
    elements.eeLinkInput.addEventListener('input', handleParameterChange);
    elements.iktypeSelect.addEventListener('change', handleParameterChange);
    
    // Submit - trigger workflow
    elements.submitButton.addEventListener('click', handleWorkflowSubmit);
    
    // Download buttons
    elements.downloadSolver.addEventListener('click', () => handleDownload('solver'));
    elements.downloadLog.addEventListener('click', () => handleDownload('log'));
    
    // Error handling
    elements.dismissError.addEventListener('click', hideError);
    elements.retryButton.addEventListener('click', handleRetry);
}

/**
 * Set up component event handlers for workflow orchestration
 */
function setupComponentEventHandlers() {
    // Status Monitor callbacks
    statusMonitorComponent.onStatusChange = handleStatusChange;
    statusMonitorComponent.onComplete = handleWorkflowComplete;
    statusMonitorComponent.onTimeout = handleWorkflowTimeout;
}

/**
 * Handle file uploaded event
 * @param {CustomEvent} event - File uploaded event
 */
async function handleFileUploaded(event) {
    
    // Update application state
    AppState.file.uploaded = true;
    AppState.file.filename = event.detail.filename;
    AppState.file.sha = event.detail.sha;
    
    // Show success message
    showSuccess('Operation successful');
    
    // Link info component will automatically fetch link info
    // We just need to update UI state
    updateUIState();
}

/**
 * Handle link selected event
 * @param {CustomEvent} event - Link selected event
 */
function handleLinkSelected(event) {
    const { link, index, isRoot, isLeaf } = event.detail;
    
    // Auto-fill parameter based on link type
    if (isRoot && !parameterConfigComponent.parameters.baseLink) {
        // Suggest as base link if it's a root and base link is not set
        parameterConfigComponent.setParameters({ baseLink: index });
        showInfo(`Set as Base Link`);
    } else if (isLeaf && !parameterConfigComponent.parameters.eeLink) {
        // Suggest as ee link if it's a leaf and ee link is not set
        parameterConfigComponent.setParameters({ eeLink: index });
        showInfo(`Set as End Effector Link`);
    } else {
        // Let user decide - show both options
        showInfo(`Link selected: ${link.name} (index ${index})`);
    }
    
    // Update application state
    AppState.links = linkInfoComponent.getLinks();
    
    // Validate parameters
    handleParameterChange();
}

/**
 * Handle parameter change
 */
function handleParameterChange() {
    // Get current parameters from component
    const params = parameterConfigComponent.getParameters();
    
    // Update application state
    AppState.parameters = params;
    
    // Validate parameters
    const validation = parameterConfigComponent.validateParameters(params);
    
    // Enable/disable submit button based on validation
    if (validation.valid && AppState.file.uploaded) {
        elements.submitButton.disabled = false;
    } else {
        elements.submitButton.disabled = true;
    }
    
    // Update UI state
    updateUIState();
}

/**
 * Handle workflow submission
 */
async function handleWorkflowSubmit() {
    try {
        // Get parameters
        const params = parameterConfigComponent.getParameters();
        
        // Validate parameters one more time
        const validation = parameterConfigComponent.validateParameters(params);
        
        if (!validation.valid) {
            parameterConfigComponent.displayValidationErrors(validation.errors);
            showError('Parameter validation failed');
            return;
        }
        
        // Clear any previous errors
        hideError();
        
        // Disable submit button
        elements.submitButton.disabled = true;
        
        // Trigger workflow
        showInfo('Triggering workflow...');
        
        const result = await workflowTriggerComponent.triggerWorkflow({
            mode: 'generate',
            base_link: params.baseLink,
            ee_link: params.eeLink,
            iktype: params.ikType
        });
        
        if (result.success && result.runId) {
            // Update application state
            AppState.workflow.runId = result.runId;
            AppState.workflow.status = 'queued';
            AppState.workflow.startTime = Date.now();
            
            // Start monitoring workflow status
            statusMonitorComponent.startPolling(result.runId);
            
            // Start fetching logs periodically
            startLogPolling(result.runId);
            
            showSuccess('Operation successful');
            elements.submitButton.disabled = false;
        }
        
    } catch (error) {
        console.error('Workflow submission error:', error);
        await errorHandler.handleError(error, {
            operation: 'workflow-submit',
            retry: handleWorkflowSubmit
        });
        elements.submitButton.disabled = false;
    }
}

/**
 * Handle status change during workflow execution
 * @param {string} status - New status
 * @param {Object} run - Workflow run details
 */
async function handleStatusChange(status, run) {
    
    // Update application state
    AppState.workflow.status = status;
    AppState.workflow.conclusion = run.conclusion;
    
    // Update UI
    updateUIState();
    
    // Show status message
    const statusText = CONFIG.STATUS_MESSAGES[status.toUpperCase()] || status;
    showInfo(`Workflow status: ${statusText}`);
}

/**
 * Handle workflow completion
 * @param {string} status - Final status
 * @param {Object} run - Workflow run details
 */
async function handleWorkflowComplete(status, run) {
    
    // Update application state
    AppState.workflow.status = status;
    AppState.workflow.conclusion = run.conclusion;
    AppState.workflow.endTime = Date.now();
    
    // Stop log polling
    stopLogPolling();
    
    // Fetch final logs
    try {
        const logs = await logViewerComponent.fetchLogs(run.id);
        logViewerComponent.appendLog(logs);
    } catch (error) {
        console.error('Failed to fetch final logs:', error);
    }
    
    // Enable downloads if successful
    if (status === 'completed') {
        downloadComponent.setWorkflowStatus('completed', run.id);
        showSuccess('Workflow execution successful! You can now download the result files.');
    } else {
        showError(`Workflow execution failed: ${run.conclusion}`);
    }
    
    // Re-enable submit button for new submissions
    elements.submitButton.disabled = false;
    
    // Update workflow trigger component state
    workflowTriggerComponent.setWorkflowActive(false, null);
    
    // Update UI
    updateUIState();
}

/**
 * Handle workflow timeout
 */
function handleWorkflowTimeout() {
    
    // Update application state
    AppState.workflow.status = 'failed';
    AppState.workflow.conclusion = 'timeout';
    AppState.workflow.endTime = Date.now();
    
    // Stop log polling
    stopLogPolling();
    
    // Show error
    showError(CONFIG.ERROR_MESSAGES.WORKFLOW_TIMEOUT);
    
    // Re-enable submit button
    elements.submitButton.disabled = false;
    
    // Update workflow trigger component state
    workflowTriggerComponent.setWorkflowActive(false, null);
    
    // Update UI
    updateUIState();
}

/**
 * Log polling state
 */
let logPollingInterval = null;

/**
 * Start polling for logs
 * @param {number} runId - Workflow run ID
 */
function startLogPolling(runId) {
    // Stop any existing polling
    stopLogPolling();
    
    // Poll every 10 seconds
    logPollingInterval = setInterval(async () => {
        try {
            const logs = await logViewerComponent.fetchLogs(runId);
            
            // Only append if we have new content
            if (logs && logs !== logViewerComponent.getContent()) {
                logViewerComponent.clearLog();
                logViewerComponent.appendLog(logs);
            }
        } catch (error) {
            // Silently fail - logs might not be available yet
            console.log('Log fetch failed (expected during early workflow stages):', error.message);
        }
    }, 10000);
}

/**
 * Stop polling for logs
 */
function stopLogPolling() {
    if (logPollingInterval) {
        clearInterval(logPollingInterval);
        logPollingInterval = null;
    }
}

/**
 * Handle download button click
 * @param {string} type - Download type ('solver' or 'log')
 */
async function handleDownload(type) {
    try {
        if (type === 'solver') {
            await downloadComponent.downloadSolver();
        } else if (type === 'log') {
            await downloadComponent.downloadLog();
        }
    } catch (error) {
        console.error('Download error:', error);
        await errorHandler.handleError(error, {
            operation: `download-${type}`,
            retry: () => handleDownload(type)
        });
    }
}

/**
 * Handle retry action
 */
function handleRetry() {
    hideError();
    // Retry logic is handled by the error handler
    // This button is shown by the error handler with a specific retry callback
}

/**
 * Update UI state based on application state
 */
function updateUIState() {
    // Update submit button state
    const params = parameterConfigComponent.getParameters();
    const validation = parameterConfigComponent.validateParameters(params);
    const isWorkflowActive = workflowTriggerComponent.getWorkflowState().isActive;
    
    if (elements.submitButton) {
        elements.submitButton.disabled = 
            !AppState.auth.isAuthenticated || 
            !AppState.file.uploaded || 
            !validation.valid ||
            isWorkflowActive;
    }
    
    // Update download buttons state
    const workflowCompleted = AppState.workflow.status === 'completed';
    if (elements.downloadSolver) {
        elements.downloadSolver.disabled = !workflowCompleted;
    }
    if (elements.downloadLog) {
        elements.downloadLog.disabled = !workflowCompleted;
    }
}

/**
 * Update status display
 */
function updateStatusDisplay() {
    const status = AppState.workflow.status || 'not_started';
    const statusText = CONFIG.STATUS_MESSAGES[status.toUpperCase()] || CONFIG.STATUS_MESSAGES.NOT_STARTED;
    
    if (elements.statusIndicator) {
        elements.statusIndicator.className = 'status-indicator ' + status.replace('_', '-');
        const statusTextElement = elements.statusIndicator.querySelector('.status-text');
        if (statusTextElement) {
            statusTextElement.textContent = statusText;
        } else {
            elements.statusIndicator.textContent = statusText;
        }
    }
}

/**
 * Show error message
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorSection.style.display = 'block';
    elements.errorSection.className = 'error-section error';
    console.error('Error:', message);
}

/**
 * Show success message
 */
function showSuccess(message) {
    elements.errorText.textContent = message;
    elements.errorSection.style.display = 'block';
    elements.errorSection.className = 'error-section success';
    
    // Auto-hide success messages after 5 seconds
    setTimeout(() => {
        if (elements.errorSection.className.includes('success')) {
            hideError();
        }
    }, 5000);
}

/**
 * Show info message
 */
function showInfo(message) {
    elements.errorText.textContent = message;
    elements.errorSection.style.display = 'block';
    elements.errorSection.className = 'error-section info';
    
    // Auto-hide info messages after 3 seconds
    setTimeout(() => {
        if (elements.errorSection.className.includes('info')) {
            hideError();
        }
    }, 3000);
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorSection.style.display = 'none';
    elements.errorSection.className = 'error-section';
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Scroll log viewer to bottom
 */
function scrollLogToBottom() {
    if (elements.autoScroll.checked) {
        elements.logViewer.scrollTop = elements.logViewer.scrollHeight;
    }
}

/**
 * Setup resource loading error handling
 * Monitors CSS, JavaScript, and image loading failures
 */
function setupResourceErrorHandling() {
    window.addEventListener('error', (e) => {
        // Check if error is from a resource (link, script, img)
        if (e.target && (e.target.tagName === 'LINK' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'IMG')) {
            const resourceType = e.target.tagName.toLowerCase();
            const resourceUrl = e.target.src || e.target.href;
            
            console.error(`Resource loading failed [${resourceType}]:`, resourceUrl);
            
            // For critical CSS files, show a warning
            if (resourceType === 'link' && resourceUrl.includes('.css')) {
                console.warn('CSS file failed to load. Some styles may not be applied.');
            }
            
            // For critical JavaScript files, show a warning
            if (resourceType === 'script' && resourceUrl.includes('.js')) {
                console.warn('JavaScript file failed to load. Some features may not work.');
            }
        }
    }, true); // Use capture phase to catch all errors
}

/**
 * Check browser compatibility
 * Detects support for required features and provides fallbacks or warnings
 */
function checkBrowserCompatibility() {
    const requiredFeatures = {
        'IntersectionObserver': 'IntersectionObserver' in window,
        'fetch': 'fetch' in window,
        'Promise': 'Promise' in window,
        'localStorage': typeof Storage !== 'undefined',
        'CustomEvent': 'CustomEvent' in window
    };
    
    const unsupportedFeatures = [];
    
    for (const [feature, supported] of Object.entries(requiredFeatures)) {
        if (!supported) {
            unsupportedFeatures.push(feature);
            console.warn(`Browser feature not supported: ${feature}`);
        }
    }
    
    // If critical features are missing, show a warning
    if (unsupportedFeatures.length > 0) {
        console.warn('Some browser features are not supported. The application may not work correctly.');
        console.warn('Unsupported features:', unsupportedFeatures.join(', '));
        
        // Show user-friendly message for critical features
        if (!requiredFeatures.fetch || !requiredFeatures.Promise) {
            showError('Your browser is not fully supported. Please upgrade to a modern browser for the best experience.');
        }
    }
    
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('User prefers reduced motion - animations will be minimized');
        document.documentElement.classList.add('reduce-motion');
    }
}

/**
 * Handle module integration errors
 * Provides graceful degradation when UI enhancement modules fail
 * @param {string} moduleName - Name of the module that failed
 * @param {Error} error - The error that occurred
 */
function handleModuleIntegrationError(moduleName, error) {
    console.error(`Module integration error [${moduleName}]:`, error);
    
    // Log detailed error information for debugging
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    
    // Provide user-friendly fallback messages
    const fallbackMessages = {
        'NavigationManager': 'Navigation enhancements are not available. Basic navigation will still work.',
        'AnimationManager': 'Animation enhancements are not available. The application will function without animations.',
        'UIAdapter': 'UI enhancements are not available. The application will use basic styling.'
    };
    
    const message = fallbackMessages[moduleName] || `${moduleName} failed to load. Some features may be limited.`;
    console.warn(message);
    
    // Don't show error to user for non-critical UI enhancements
    // The application should continue to work with basic functionality
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
