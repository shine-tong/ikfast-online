# 测试套件

本目录包含 IKFast Online Generator 的单元测试。

## 运行测试

```bash
# 运行所有测试
npm test

# 以监视模式运行测试
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- test/auth.test.js
```

## 测试文件

### auth.test.js
`AuthenticationManager` 类的测试：
- Token 存储和检索（6 个测试）
- Token 验证（8 个测试）
- 身份验证状态管理（2 个测试）

**总计：16 个测试**

### github-api.test.js
`GitHubAPIClient` 类的测试：
- API 请求格式化（3 个测试）
- 各种 HTTP 状态码的错误处理（6 个测试）
- 文件上传功能（3 个测试）
- 工作流触发（2 个测试）
- 工作流运行详情（1 个测试）
- 制品列表（1 个测试）
- 制品下载（1 个测试）
- 活动工作流检测（2 个测试）

**总计：19 个测试**

### workflow.test.js
GitHub Actions 工作流文件的测试：
- YAML 语法验证（6 个测试）
- 工作流配置（3 个测试）
- 工作流步骤（6 个测试）
- Docker 配置（3 个测试）
- Info 模式工作流（4 个测试）
- Generate 模式工作流（6 个测试）
- 制品上传（4 个测试）
- 输入验证（4 个测试）
- 错误处理（3 个测试）
- 日志输出（2 个测试）

**总计：41 个测试**

## 测试框架

- **Vitest**：快速的单元测试框架
- **happy-dom**：用于测试的轻量级 DOM 实现
- **vi**：模拟和监视工具

## 覆盖率

运行 `npm run test:coverage` 生成覆盖率报告。
