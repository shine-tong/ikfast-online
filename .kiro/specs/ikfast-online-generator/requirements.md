# Requirements Document

## Introduction

IKFast Online Generator 是一个基于 Web 的在线平台，允许用户通过浏览器上传 URDF 机器人描述文件，自动生成 IKFast 逆运动学求解器 C++ 代码。该系统利用 GitHub Pages 作为前端托管，GitHub Actions 作为后端计算引擎，在 Docker 容器中执行 OpenRAVE/IKFast 工具链，实现零服务器成本的自动化求解器生成服务。

## Glossary

- **System**: IKFast Online Generator 平台
- **User**: 使用该平台生成 IKFast 求解器的机器人开发者
- **URDF**: Unified Robot Description Format，统一机器人描述格式
- **IKFast**: 快速逆运动学求解器生成工具
- **Collada_DAE**: 数字资产交换格式，OpenRAVE 所需的机器人模型格式
- **GitHub_API**: GitHub REST API 接口
- **Workflow**: GitHub Actions 工作流
- **Artifact**: GitHub Actions 生成的输出文件
- **Base_Link**: 机器人运动链的基座链接
- **End_Effector_Link**: 机器人运动链的末端执行器链接
- **Docker_Container**: 运行 OpenRAVE 环境的隔离容器
- **Frontend**: 托管在 GitHub Pages 的静态网页应用
- **Backend**: 通过 GitHub Actions 执行的后端处理逻辑

## Requirements

### Requirement 1: URDF 文件上传

**User Story:** 作为机器人开发者，我希望通过网页上传 URDF 文件，以便系统能够处理我的机器人模型

#### Acceptance Criteria

1. WHEN a User selects a local file, THE System SHALL validate that the file extension is .urdf
2. WHEN a User uploads a valid URDF file, THE System SHALL submit the file content to the GitHub repository via GitHub_API
3. WHEN the upload is successful, THE System SHALL store the file at path jobs/current/robot.urdf
4. IF the upload fails due to network or API errors, THEN THE System SHALL display a descriptive error message to the User
5. WHEN uploading a file, THE System SHALL display upload progress feedback to the User

### Requirement 2: 机器人链接信息获取

**User Story:** 作为机器人开发者，我希望系统自动解析并展示机器人的链接结构信息，以便我能够选择正确的 Base_Link 和 End_Effector_Link

#### Acceptance Criteria

1. WHEN a URDF file is successfully uploaded, THE System SHALL automatically trigger a Workflow to extract link information
2. WHEN extracting link information, THE System SHALL execute the command `openrave-robot.py robot.dae --info links` in Docker_Container
3. WHEN link information is extracted, THE System SHALL parse and display each link's name, index, and parent relationships
4. WHEN displaying link information, THE System SHALL present the data in a user-friendly table or list format
5. IF link extraction fails, THEN THE System SHALL display the error output from OpenRAVE to the User

### Requirement 3: IKFast 参数配置

**User Story:** 作为机器人开发者，我希望配置 IKFast 生成参数，以便生成符合我机器人运动链要求的求解器

#### Acceptance Criteria

1. WHEN link information is displayed, THE System SHALL provide input fields for Base_Link index and End_Effector_Link index
2. WHEN a User enters link indices, THE System SHALL validate that the values are non-negative integers
3. THE System SHALL provide a dropdown selection for iktype parameter with options including transform6d, translation3d, and other valid IKFast types
4. THE System SHALL set the default iktype value to transform6d
5. WHEN a User submits invalid parameters, THE System SHALL prevent submission and display validation error messages

### Requirement 4: IKFast 求解器生成任务执行

**User Story:** 作为机器人开发者，我希望系统自动执行完整的 IKFast 生成流程，以便获得可用的求解器代码

#### Acceptance Criteria

1. WHEN a User submits valid parameters, THE System SHALL trigger a GitHub_API workflow dispatch request
2. WHEN the Workflow executes, THE System SHALL run all steps inside Docker_Container using the fishros2/openrave image
3. WHEN executing the workflow, THE System SHALL perform URDF to Collada_DAE conversion using `rosrun collada_urdf urdf_to_collada`
4. WHEN executing the workflow, THE System SHALL generate the IKFast solver using the ikfast.py script with user-specified parameters
5. WHEN the workflow completes successfully, THE System SHALL save the generated ikfast_solver.cpp file to the outputs directory
6. WHEN the workflow completes, THE System SHALL save all command outputs to outputs/build.log
7. IF any step fails, THEN THE System SHALL capture the error output and mark the workflow as failed

### Requirement 5: 任务状态实时监控

**User Story:** 作为机器人开发者，我希望实时查看任务执行状态和进度，以便了解生成过程是否正常进行

#### Acceptance Criteria

1. WHEN a Workflow is triggered, THE System SHALL poll the GitHub_API to retrieve the workflow run status
2. WHEN polling status, THE System SHALL query at intervals no shorter than 5 seconds to respect API rate limits
3. WHEN displaying status, THE System SHALL show one of the following states: queued, in_progress, completed, or failed
4. WHILE a Workflow is running, THE System SHALL continuously update the status display without requiring User refresh
5. WHEN the Workflow status changes, THE System SHALL update the Frontend display within 10 seconds

### Requirement 6: 实时日志展示

**User Story:** 作为机器人开发者，我希望查看详细的执行日志，以便诊断问题和理解生成过程

#### Acceptance Criteria

1. WHEN a Workflow is running or completed, THE System SHALL retrieve and display the build.log content
2. WHEN displaying logs, THE System SHALL preserve all original terminal output including ANSI formatting where possible
3. WHEN displaying logs, THE System SHALL clearly mark each execution step with STEP identifiers
4. WHEN new log content is available, THE System SHALL append it to the display without clearing previous content
5. WHEN displaying logs, THE System SHALL provide a terminal-style monospace font interface with scrolling capability

### Requirement 7: 结果文件下载

**User Story:** 作为机器人开发者，我希望下载生成的求解器代码和日志文件，以便集成到我的 MoveIt 配置中

#### Acceptance Criteria

1. WHEN a Workflow completes successfully, THE System SHALL provide a download link for ikfast_solver.cpp
2. WHEN a Workflow completes, THE System SHALL provide a download link for the complete build.log file
3. WHEN a User clicks a download link, THE System SHALL retrieve the file from GitHub_API Artifact storage
4. WHEN downloading files, THE System SHALL use appropriate Content-Disposition headers to suggest correct filenames
5. IF Artifact retrieval fails, THEN THE System SHALL display an error message with retry instructions

### Requirement 8: GitHub API 认证与权限管理

**User Story:** 作为系统管理员，我希望安全地管理 GitHub API 访问权限，以便保护仓库安全并控制操作范围

#### Acceptance Criteria

1. THE System SHALL use a GitHub Personal Access Token or GitHub App token for API authentication
2. THE System SHALL request only the minimum required permissions: repo contents write and actions workflow dispatch
3. WHEN storing authentication tokens, THE System SHALL use GitHub Secrets or environment variables, never hardcoding in Frontend code
4. WHEN making API requests, THE System SHALL include proper authentication headers
5. IF authentication fails, THEN THE System SHALL display a clear error message indicating permission issues

### Requirement 9: 错误处理与用户反馈

**User Story:** 作为机器人开发者，我希望在出现错误时获得清晰的提示信息，以便快速定位和解决问题

#### Acceptance Criteria

1. WHEN any API request fails, THE System SHALL display the HTTP status code and error message to the User
2. WHEN URDF to Collada_DAE conversion fails, THE System SHALL display the OpenRAVE error output
3. WHEN IKFast generation fails, THE System SHALL display the ikfast.py error output and suggest common solutions
4. WHEN network errors occur, THE System SHALL provide retry options to the User
5. WHEN displaying errors, THE System SHALL use distinct visual styling to differentiate errors from normal log output

### Requirement 10: Docker 容器隔离执行

**User Story:** 作为系统管理员，我希望所有用户提交的文件在隔离环境中处理，以便保证系统安全性

#### Acceptance Criteria

1. THE System SHALL execute all URDF processing and IKFast generation inside Docker_Container
2. THE System SHALL use the fishros2/openrave Docker image which includes ROS and OpenRAVE dependencies
3. WHEN running Docker_Container, THE System SHALL mount only the necessary workspace directory with read-write permissions
4. THE System SHALL NOT execute arbitrary user-provided code outside of the standard URDF/Collada processing pipeline
5. WHEN Docker_Container execution completes, THE System SHALL clean up temporary files and container instances

### Requirement 11: 文件存储与版本管理

**User Story:** 作为机器人开发者，我希望系统妥善管理我的输入和输出文件，以便追溯历史生成记录

#### Acceptance Criteria

1. WHEN a User uploads a new URDF file, THE System SHALL overwrite the previous jobs/current/robot.urdf file
2. WHEN a Workflow completes, THE System SHALL store outputs in the outputs directory
3. WHEN storing Artifacts, THE System SHALL use GitHub Actions artifact upload with retention period of at least 7 days
4. THE System SHALL maintain a single active job at jobs/current/ to prevent concurrent execution conflicts
5. WHERE multiple Users access the system concurrently, THE System SHALL process requests sequentially using GitHub Actions queue

### Requirement 12: 前端用户界面

**User Story:** 作为机器人开发者，我希望使用直观的网页界面完成所有操作，以便无需学习命令行工具

#### Acceptance Criteria

1. THE Frontend SHALL provide a file upload button with clear labeling for URDF file selection
2. THE Frontend SHALL display a configuration form with labeled input fields for Base_Link, End_Effector_Link, and iktype
3. THE Frontend SHALL provide a submit button that triggers the IKFast generation workflow
4. THE Frontend SHALL display a status indicator showing the current workflow state
5. THE Frontend SHALL provide a log viewer panel with auto-scrolling capability
6. THE Frontend SHALL provide download buttons that become enabled when results are available
7. THE Frontend SHALL be responsive and functional on desktop browsers with minimum viewport width of 1024px

### Requirement 13: 性能与资源限制

**User Story:** 作为系统管理员，我希望控制资源使用，以便保持在 GitHub 免费额度范围内

#### Acceptance Criteria

1. THE System SHALL limit URDF file uploads to a maximum size of 10MB
2. THE System SHALL set a timeout of 30 minutes for Workflow execution
3. IF a Workflow exceeds the timeout, THEN THE System SHALL terminate execution and notify the User
4. THE System SHALL limit API polling frequency to no more than once per 5 seconds
5. THE System SHALL display a warning to Users if GitHub Actions minutes quota is approaching limits

### Requirement 14: 可追溯性与日志记录

**User Story:** 作为系统管理员，我希望完整记录每次生成过程，以便审计和问题排查

#### Acceptance Criteria

1. WHEN a Workflow executes, THE System SHALL log all command invocations with timestamps
2. WHEN a Workflow executes, THE System SHALL capture both stdout and stderr from all commands
3. THE System SHALL preserve complete logs in the build.log Artifact for the retention period
4. THE System SHALL include workflow run ID and commit SHA in log metadata
5. WHEN a Workflow completes, THE System SHALL record the final status (success or failure) in the log

### Requirement 15: URDF 文件验证

**User Story:** 作为机器人开发者，我希望系统验证我的 URDF 文件格式，以便在提交前发现明显错误

#### Acceptance Criteria

1. WHEN a User selects a file, THE System SHALL verify the file has a .urdf extension
2. WHEN a User uploads a file, THE System SHALL check that the file size is within the allowed limit
3. WHEN a User uploads a file, THE System SHALL verify the file contains valid XML structure
4. IF the file fails basic validation, THEN THE System SHALL prevent upload and display specific validation errors
5. THE System SHALL allow the upload to proceed even if semantic URDF validation cannot be performed in Frontend

### Requirement 16: 链接信息解析与展示

**User Story:** 作为机器人开发者，我希望清晰地看到机器人的链接层次结构，以便准确选择运动链的起点和终点

#### Acceptance Criteria

1. WHEN parsing link information, THE System SHALL extract link index, link name, and parent link information
2. WHEN displaying link information, THE System SHALL show links in a table with columns for Index, Name, and Parent
3. WHEN displaying link information, THE System SHALL highlight links that have no parent as potential base links
4. WHEN displaying link information, THE System SHALL highlight links that have no children as potential end effector links
5. THE System SHALL allow Users to click on a link row to auto-fill the corresponding index input field

### Requirement 17: IKFast 类型选择

**User Story:** 作为机器人开发者，我希望选择适合我机器人的 IKFast 求解器类型，以便生成正确的运动学解

#### Acceptance Criteria

1. THE System SHALL provide iktype options including: transform6d, translation3d, direction3d, ray4d, lookat3d, translationdirection5d, and translationxy5d
2. THE System SHALL display a brief description for each iktype option
3. THE System SHALL set transform6d as the default iktype selection
4. WHEN a User selects an iktype, THE System SHALL pass the selected value to the Workflow dispatch
5. THE System SHALL validate that the selected iktype is one of the supported values before submission

### Requirement 18: 并发任务处理

**User Story:** 作为系统管理员，我希望系统正确处理多个用户同时提交任务的情况，以便避免数据冲突

#### Acceptance Criteria

1. WHEN multiple Users trigger workflows concurrently, THE System SHALL queue the workflows using GitHub Actions built-in queuing
2. THE System SHALL process workflows sequentially to prevent file conflicts in jobs/current/
3. WHEN a Workflow is queued, THE System SHALL display the queue position to the User
4. THE System SHALL NOT allow a User to trigger a new workflow while their previous workflow is still running
5. WHERE a User attempts to submit while a workflow is active, THE System SHALL display a message indicating the workflow is in progress

### Requirement 19: 结果文件完整性验证

**User Story:** 作为机器人开发者，我希望确认生成的求解器文件是完整且有效的，以便安全地用于生产环境

#### Acceptance Criteria

1. WHEN a Workflow completes successfully, THE System SHALL verify that ikfast_solver.cpp file exists in outputs/
2. WHEN a Workflow completes successfully, THE System SHALL verify that ikfast_solver.cpp file size is greater than 0 bytes
3. WHEN displaying download options, THE System SHALL show the file size of ikfast_solver.cpp
4. IF the generated file is missing or empty, THEN THE System SHALL mark the workflow as failed and display an error
5. THE System SHALL include a checksum or file hash in the log for verification purposes

### Requirement 20: 用户指引与文档

**User Story:** 作为新用户，我希望获得清晰的操作指引，以便快速上手使用该平台

#### Acceptance Criteria

1. THE Frontend SHALL display a brief introduction explaining the purpose of the platform
2. THE Frontend SHALL provide step-by-step instructions for the complete workflow
3. THE Frontend SHALL include tooltips or help icons explaining technical terms like Base_Link and End_Effector_Link
4. THE Frontend SHALL provide a link to example URDF files for testing
5. THE Frontend SHALL include a FAQ section addressing common issues and error messages
