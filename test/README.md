# 测试套件

本目录包含 IKFast Online Generator 的单元测试和属性测试。

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行属性测试
npm run test:property

# 以监视模式运行测试
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- test/auth.test.js
```

## 测试类型

### 单元测试 (Unit Tests)

单元测试验证特定示例、边缘情况和错误条件。

**测试文件**: `*.test.js`

### 属性测试 (Property-Based Tests)

属性测试验证跨所有输入的通用属性，使用 fast-check 库生成随机测试数据。

**测试文件**: `*.property.test.js`

**配置**: 每个属性测试运行至少 100 次迭代

## 测试文件

### 单元测试

#### auth.test.js
`AuthenticationManager` 类的测试：
- Token 存储和检索（6 个测试）
- Token 验证（8 个测试）
- 身份验证状态管理（2 个测试）

**总计：16 个测试**

#### github-api.test.js
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

#### workflow.test.js
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

#### ui-adapter.test.js
UI 适配器的测试：
- 文件上传拖放功能
- 状态监控图标显示
- 日志语法高亮

#### graphite-integration.test.js
Graphite 模板集成测试：
- 认证功能保留
- 文件上传功能保留
- 参数配置功能保留
- 工作流触发功能保留
- 状态监控功能保留
- 日志查看功能保留
- 下载功能保留

#### checkpoint-verification.test.js
检查点验证测试：
- 基础功能验证（Checkpoint 8）
- 完整功能测试（Checkpoint 12）

### 属性测试

#### style-system.property.test.js
样式系统属性测试：
- **Property 1**: 资源加载完整性
- **Property 2**: 主题颜色一致性
- **Property 4**: Section 间距一致性
- **Property 12**: 相对路径资源引用

#### navigation.property.test.js
导航功能属性测试：
- **Property 5**: 导航链接平滑滚动
- **Property 6**: 滚动位置与导航高亮同步
- **Property 7**: 汉堡菜单切换状态

#### animations.property.test.js
动画系统属性测试：
- **Property 3**: 交互元素悬停效果
- **Property 10**: 动画使用性能优化属性

#### responsive.property.test.js
响应式设计属性测试：
- **Property 8**: 响应式布局适配
- **Property 9**: 触摸目标尺寸

#### accessibility.property.test.js
可访问性属性测试：
- **Property 11**: 语义化 HTML 和 ARIA 属性
- **Property 13**: 键盘导航支持
- **Property 14**: 焦点指示器可见性
- **Property 15**: 颜色对比度合规性
- **Property 16**: 图片 Alt 文本完整性

## 测试辅助工具

### test/helpers/test-utils.js

提供测试辅助函数：
- `calculateContrastRatio()`: 计算颜色对比度
- `isThemeColor()`: 检查颜色是否为主题颜色
- `setViewportSize()`: 设置视口大小
- `waitForAnimation()`: 等待动画完成

## 测试框架

- **Vitest**: 快速的单元测试框架
- **fast-check**: JavaScript 属性测试库
- **happy-dom**: 用于测试的轻量级 DOM 实现
- **vi**: 模拟和监视工具

## 覆盖率

运行 `npm run test:coverage` 生成覆盖率报告。

目标覆盖率：≥80%

## 测试标签格式

属性测试使用以下标签格式：

```
Feature: integrate-graphite-template, Property {number}: {property_text}
```

示例：
```javascript
it('Property 1: Resource loading integrity', () => {
  // Feature: integrate-graphite-template, Property 1: Resource loading integrity
  // ...
});
```
