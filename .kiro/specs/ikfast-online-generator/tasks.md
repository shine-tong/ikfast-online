# Implementation Plan: IKFast Online Generator

## Overview

This implementation plan breaks down the IKFast Online Generator into discrete coding tasks. The system will be built incrementally, starting with core infrastructure, then adding frontend components, GitHub Actions workflow, and finally integration and testing. Each task builds on previous work to ensure continuous validation.

## Tasks

- [x] 1. Set up project structure and configuration
  - Create directory structure: `web/`, `jobs/current/`, `outputs/`, `.github/workflows/`
  - Create `web/index.html` with basic HTML structure
  - Create `web/style.css` with base styles
  - Create `web/config.js` with configuration constants (repo owner, repo name, workflow file, polling interval, max file size)
  - Create `web/main.js` as entry point
  - Set up GitHub Pages configuration
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 2. Implement authentication and GitHub API client
  - [x] 2.1 Create `AuthenticationManager` class
    - Implement token storage in sessionStorage
    - Implement `getToken()`, `setToken()`, `validateToken()` methods
    - Add UI for token input (modal or inline form)
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [x] 2.2 Create `GitHubAPIClient` class
    - Implement base request method with authentication headers
    - Implement error handling for API responses (401, 403, 404, 422, 5xx)
    - Implement methods: `uploadFile()`, `triggerWorkflow()`, `getWorkflowRun()`, `listArtifacts()`, `downloadArtifact()`
    - _Requirements: 1.2, 1.4, 8.4, 8.5, 9.1_
  
  - [x] 2.3 Write unit tests for AuthenticationManager
    - Test token storage and retrieval
    - Test token validation
    - _Requirements: 8.1, 8.3_
  
  - [x] 2.4 Write unit tests for GitHubAPIClient
    - Test API request formatting
    - Test error handling for各种 HTTP status codes
    - Mock GitHub API responses
    - _Requirements: 1.4, 8.5, 9.1_

- [x] 3. Implement file upload component
  - [x] 3.1 Create `FileUploadComponent` class
    - Implement file selection handler
    - Implement file validation: extension (.urdf), size (<=10MB), XML structure
    - Implement upload progress tracking
    - Implement GitHub API upload with base64 encoding
    - Add UI elements: file input, upload button, progress bar, error display
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 13.1, 15.1, 15.2, 15.3, 15.4_
  
  - [x] 3.2 Write property test for file extension validation
    - **Property 1: File Extension Validation**
    - **Validates: Requirements 1.1, 15.1**
  
  - [x] 3.3 Write property test for file size validation
    - **Property 2: File Size Validation**
    - **Validates: Requirements 13.1, 15.2**
  
  - [x] 3.4 Write property test for XML validation
    - **Property 3: XML Structure Validation**
    - **Validates: Requirements 15.3**
  
  - [x] 3.5 Write unit tests for FileUploadComponent
    - Test file selection with valid/invalid files
    - Test upload progress updates
    - Test error display
    - _Requirements: 1.1, 1.5, 15.4_

- [x] 4. Implement link information component
  - [x] 4.1 Create `LinkInfoComponent` class
    - Implement workflow trigger for info mode
    - Implement link info parsing from OpenRAVE output
    - Implement link table rendering with Index, Name, Parent columns
    - Implement highlighting for root links (no parent) and leaf links (no children)
    - Implement click handler for auto-filling link indices
    - Add UI elements: link table, loading indicator
    - _Requirements: 2.1, 2.3, 2.4, 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 4.2 Write property test for link information parsing
    - **Property 8: Link Information Parsing**
    - **Validates: Requirements 2.3, 16.1**
  
  - [x] 4.3 Write property test for link table display
    - **Property 9: Link Table Display**
    - **Validates: Requirements 2.4, 16.2, 16.3, 16.4**
  
  - [x] 4.4 Write property test for link selection auto-fill
    - **Property 10: Link Selection Auto-fill**
    - **Validates: Requirements 16.5**
  
  - [x] 4.5 Write unit tests for LinkInfoComponent
    - Test parsing with sample OpenRAVE output
    - Test table rendering
    - Test click handlers
    - _Requirements: 2.3, 2.4, 16.5_

- [x] 5. Implement parameter configuration component
  - [x] 5.1 Create `ParameterConfigComponent` class
    - Implement input fields for base_link and ee_link indices
    - Implement validation: non-negative integers, base_link ≠ ee_link
    - Implement iktype dropdown with all supported types and descriptions
    - Set default iktype to "transform6d"
    - Implement parameter validation before submission
    - Add UI elements: input fields, dropdown, validation error messages, tooltips
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 17.1, 17.2, 17.3, 17.4, 17.5, 20.3_
  
  - [x] 5.2 Write property test for parameter validation
    - **Property 11: Parameter Validation**
    - **Validates: Requirements 3.2**
  
  - [x] 5.3 Write property test for invalid parameter rejection
    - **Property 12: Invalid Parameter Rejection**
    - **Validates: Requirements 3.5, 17.5**
  
  - [x] 5.4 Write unit tests for ParameterConfigComponent
    - Test input validation
    - Test default values
    - Test iktype options
    - Test tooltip display
    - _Requirements: 3.2, 3.4, 3.5, 17.2, 20.3_

- [x] 6. Implement workflow trigger and status monitoring
  - [x] 6.1 Create `WorkflowTriggerComponent` class
    - Implement workflow dispatch with parameters
    - Implement check for active workflows
    - Implement submit button enable/disable logic
    - Add UI elements: submit button, workflow status message
    - _Requirements: 4.1, 18.4, 18.5_
  
  - [x] 6.2 Create `StatusMonitorComponent` class
    - Implement polling with 5-second minimum interval
    - Implement exponential backoff for polling
    - Implement status mapping (queued, in_progress, completed, failed)
    - Implement 30-minute timeout
    - Implement status display updates
    - Add UI elements: status indicator, queue position display
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 13.4, 18.3_
  
  - [x] 6.3 Write property test for workflow dispatch
    - **Property 13: Workflow Dispatch with Parameters**
    - **Validates: Requirements 4.1, 4.4, 17.4**
  
  - [x] 6.4 Write property test for status polling interval
    - **Property 17: Status Polling**
    - **Validates: Requirements 5.1, 5.2, 5.4, 13.4**
  
  - [x] 6.5 Write property test for status display mapping
    - **Property 18: Status Display Mapping**
    - **Validates: Requirements 5.3**
  
  - [x] 6.6 Write property test for concurrent workflow prevention
    - **Property 32: Concurrent Workflow Prevention**
    - **Validates: Requirements 18.4, 18.5**
  
  - [x] 6.7 Write unit tests for WorkflowTriggerComponent and StatusMonitorComponent
    - Test workflow triggering
    - Test polling start/stop
    - Test timeout handling
    - Test status updates
    - _Requirements: 4.1, 5.1, 5.5, 18.4_

- [x] 7. Checkpoint - Test file upload and workflow triggering
  - Manually test uploading a URDF file
  - Verify link information is displayed
  - Verify workflow can be triggered
  - Ensure all tests pass, ask the user if questions arise

- [x] 8. Implement log viewer component
  - [x] 8.1 Create `LogViewerComponent` class
    - Implement log retrieval from workflow or artifact
    - Implement log appending (not clearing)
    - Implement STEP marker highlighting
    - Implement ANSI code handling (preserve or convert to HTML)
    - Implement auto-scrolling to bottom
    - Implement error styling differentiation
    - Add UI elements: log viewer panel with monospace font, auto-scroll toggle
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.5_
  
  - [x] 8.2 Write property test for log incremental append
    - **Property 23: Log Incremental Append**
    - **Validates: Requirements 6.4**
  
  - [x] 8.3 Write property test for log content preservation
    - **Property 21: Log Content Preservation**
    - **Validates: Requirements 6.2**
  
  - [x] 8.4 Write property test for STEP highlighting
    - **Property 22: Log Step Highlighting**
    - **Validates: Requirements 6.3**
  
  - [x] 8.5 Write unit tests for LogViewerComponent
    - Test log appending
    - Test ANSI code handling
    - Test auto-scrolling
    - Test error styling
    - _Requirements: 6.2, 6.3, 6.4, 9.5_

- [x] 9. Implement download component
  - [x] 9.1 Create `DownloadComponent` class
    - Implement artifact listing
    - Implement artifact download and ZIP extraction
    - Implement browser download trigger with correct filenames
    - Implement file size display
    - Implement download link enable/disable based on workflow status
    - Add UI elements: download buttons for ikfast_solver.cpp and build.log, file size labels
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 12.6, 19.3_
  
  - [x] 9.2 Write property test for download link availability
    - **Property 24: Download Link Availability**
    - **Validates: Requirements 7.1, 7.2, 12.6**
  
  - [x] 9.3 Write property test for artifact download
    - **Property 25: Artifact Download**
    - **Validates: Requirements 7.3, 7.4**
  
  - [x] 9.4 Write unit tests for DownloadComponent
    - Test artifact listing
    - Test ZIP extraction
    - Test download triggering
    - Test file size formatting
    - _Requirements: 7.3, 7.4, 19.3_

- [x] 10. Implement error handling and user feedback
  - [x] 10.1 Create error handling utilities
    - Implement error classes: `NetworkError`, `ValidationError`, `GitHubAPIError`
    - Implement global error handler with retry logic
    - Implement error display component with styling
    - Implement retry button for network errors
    - Add UI elements: error modal/banner, retry button
    - _Requirements: 1.4, 2.5, 7.5, 8.5, 9.1, 9.2, 9.3, 9.4_
  
  - [x] 10.2 Write property test for error message display
    - **Property 6: Error Message Display**
    - **Validates: Requirements 1.4, 2.5, 7.5, 8.5, 9.1, 9.2, 9.3, 9.4**
  
  - [x] 10.3 Write property test for retry option
    - **Property 28: Retry Option for Network Errors**
    - **Validates: Requirements 9.4**
  
  - [x] 10.4 Write unit tests for error handling
    - Test error classification
    - Test error display
    - Test retry logic
    - _Requirements: 1.4, 9.1, 9.4_

- [x] 11. Create GitHub Actions workflow
  - [x] 11.1 Create `.github/workflows/ikfast.yml`
    - Define workflow_dispatch trigger with inputs: mode, base_link, ee_link, iktype
    - Implement input validation step
    - Implement Docker execution step for info mode (URDF → Collada, extract links)
    - Implement Docker execution step for generate mode (full pipeline)
    - Use fishros2/openrave Docker image
    - Mount workspace directory to /ws
    - Capture all output to log files (info.log or build.log)
    - Implement artifact upload step with 7-day retention
    - Set 30-minute timeout
    - Implement concurrency control (single active workflow)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.1, 10.2, 10.3, 10.5, 11.3, 11.5, 13.2_
  
  - [x] 11.2 Write workflow validation tests
    - Validate YAML syntax
    - Test with sample URDF files
    - Test both info and generate modes
    - Verify artifact upload
    - _Requirements: 4.2, 4.3, 4.5, 4.6_

- [x] 12. Implement UI layout and styling
  - [x] 12.1 Design and implement main page layout
    - Create header with title and introduction
    - Create step-by-step instructions section
    - Create file upload section
    - Create link information section
    - Create parameter configuration section
    - Create workflow status section
    - Create log viewer section
    - Create download section
    - Implement responsive design (min 1024px width)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 20.1, 20.2_
  
  - [x] 12.2 Implement tooltips and help system
    - Add tooltips for technical terms (Base Link, End Effector Link, IKType)
    - Add help icons with explanations
    - Create FAQ section
    - Add link to example URDF files
    - _Requirements: 20.3, 20.4, 20.5_
  
  - [x] 12.3 Write unit tests for UI components
    - Test tooltip display
    - Test responsive layout
    - Test accessibility (ARIA labels, keyboard navigation)
    - _Requirements: 12.7, 20.3_

- [x] 13. Implement additional features and validations
  - [x] 13.1 Implement file overwrite logic
    - Ensure new uploads overwrite jobs/current/robot.urdf
    - Implement single active job constraint
    - _Requirements: 11.1, 11.4_
  
  - [x] 13.2 Implement output file verification
    - Check ikfast_solver.cpp exists and size > 0
    - Compute and log file checksum (SHA256)
    - Mark workflow as failed if file is missing/empty
    - _Requirements: 19.1, 19.2, 19.4, 19.5_
  
  - [x] 13.3 Implement quota warning
    - Check GitHub Actions minutes usage via API
    - Display warning when >80% used
    - _Requirements: 13.5_
  
  - [x] 13.4 Write property tests for file operations
    - **Property 29: File Overwrite on Upload**
    - **Validates: Requirements 11.1**
    - **Property 34: File Integrity Verification**
    - **Validates: Requirements 19.4**
    - **Property 36: Checksum Logging**
    - **Validates: Requirements 19.5**
  
  - [x] 13.5 Write unit tests for additional features
    - Test file overwrite
    - Test file verification
    - Test quota warning display
    - _Requirements: 11.1, 19.4, 13.5_

- [x] 14. Checkpoint - Test complete workflow
  - Test complete workflow: upload → link info → configure → generate → download
  - Test error scenarios: invalid URDF, invalid parameters, network errors
  - Test concurrent access prevention
  - Ensure all tests pass, ask the user if questions arise

- [x] 15. Integration and wiring
  - [x] 15.1 Wire all components together in main.js
    - Initialize all components
    - Set up event listeners and data flow
    - Implement state management
    - Connect components to GitHub API client
    - Implement workflow orchestration
    - _Requirements: All requirements_
  
  - [x] 15.2 Write integration tests
    - Test complete user workflows
    - Test error recovery flows
    - Test state transitions
    - _Requirements: All requirements_

- [x] 16. Documentation and deployment preparation
  - [x] 16.1 Create README.md
    - Add project description
    - Add setup instructions
    - Add usage guide
    - Add troubleshooting section
    - Add contribution guidelines
  
  - [x] 16.2 Configure GitHub Pages
    - Set source to main branch
    - Set directory to /web or root
    - Verify deployment
  
  - [x] 16.3 Create example URDF files
    - Add sample URDF files for testing
    - Document robot specifications
    - _Requirements: 20.4_

- [x] 17. Final testing and validation
  - [x] 17.1 Run all property tests
    - Verify all 40 properties pass with 100 iterations each
    - _Requirements: All testable requirements_
  
  - [x] 17.2 Run all unit tests
    - Verify >80% code coverage
    - _Requirements: All requirements_
  
  - [x] 17.3 Run E2E tests
    - Test with multiple browser types
    - Test with various URDF files
    - Test all error scenarios
    - _Requirements: All requirements_
  
  - [x] 17.4 Manual testing
    - Test complete workflows
    - Test edge cases
    - Verify UI/UX
    - Test on different screen sizes

- [x] 18. Final checkpoint - Production readiness
  - All tests passing
  - Documentation complete
  - GitHub Pages deployed
  - Workflow tested with real URDF files
  - Ask the user if ready for production deployment

## Notes

- All testing tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100 iterations each
- Unit tests validate specific examples, edge cases, and UI interactions
- The workflow is designed to be built incrementally with continuous testing
- GitHub Actions workflow should be tested in a separate branch before merging to main
